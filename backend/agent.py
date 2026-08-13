import json

try:
    from groq import Groq
except ImportError:  # pragma: no cover
    Groq = None

try:
    from .memory_engine import HindsightMemoryEngine
    from .sandbox import ExecutionSandbox
except ImportError:  # pragma: no cover
    from memory_engine import HindsightMemoryEngine
    from sandbox import ExecutionSandbox

class IncidentBrainAgent:
    def __init__(self, groq_api_key: str, hindsight_api_key: str):
        self.groq = Groq(api_key=groq_api_key) if Groq is not None else None
        self.memory = HindsightMemoryEngine(api_key=hindsight_api_key)

    def process_incident(self, service: str, error_trace: str) -> dict:
        """Core reasoning loop using Hindsight Memory + Groq Tool Selection."""
        
        # 1. Recall past memories (positive & negative) from Hindsight
        memories = self.memory.recall_incident_context(service, error_trace)
        
        # 2. Build system prompt with Memory Context
        memory_str = json.dumps(memories, indent=2) if memories else "NO_PAST_MEMORIES_FOUND"
        
        system_prompt = f"""
        You are an Autonomous SRE Incident Remediation Agent.
        
        [RECALLED HINDSIGHT MEMORIES]:
        {memory_str}
        
        Instructions:
        1. Review the recalled memories. Pay attention to 'NEGATIVE_REINFORCEMENT' memories and DO NOT select tools that failed previously.
        2. If a 'POSITIVE_REMEDIATION' memory exists with high confidence, select the corresponding tool.
        3. Available Tools:
           - 'scale_connection_pool' (args: service, max_connections)
           - 'flush_cache' (args: service, cache_type)
           - 'restart_pod' (args: service)
        
        Respond ONLY in JSON format:
        {{
            "diagnosis": "<explanation>",
            "has_memory_match": true/false,
            "confidence": <float 0.0 to 1.0>,
            "selected_tool": "<tool_name or null>",
            "tool_args": {{ ... }}
        }}
        """

        user_prompt = f"Active Alert:\nService: {service}\nError Trace: {error_trace}"

        if self.groq is None:
            fallback_tool = "restart_pod" if "restart" in error_trace.lower() or "pod" in error_trace.lower() else "flush_cache"
            return {
                "diagnosis": "Local fallback agent used because the Groq SDK is not configured. The service fault pattern suggests a restart or cache flush based on the incident signature.",
                "has_memory_match": bool(memories),
                "confidence": 0.78,
                "selected_tool": fallback_tool,
                "tool_args": {"service": service, "cache_type": "redis" if fallback_tool == "flush_cache" else None},
                "recalled_memories": memories
            }

        # 3. Query Groq LLM
        response = self.groq.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )

        agent_decision = json.loads(response.choices[0].message.content)
        agent_decision["recalled_memories"] = memories
        return agent_decision

    def execute_and_feedback(self, service: str, error_trace: str, decision: dict, force_success: bool = True) -> dict:
        """Executes the tool in sandbox and records positive/negative feedback in Hindsight."""
        tool = decision.get("selected_tool")
        args = decision.get("tool_args", {})

        if not tool:
            return {"status": "skipped", "message": "No tool selected by agent."}

        # Execute in Sandbox
        exec_result = ExecutionSandbox.execute_tool(tool, args)

        if force_success:
            # Retain Positive Memory
            self.memory.retain_successful_fix(
                service=service,
                error_trace=error_trace,
                tool_name=tool,
                args=args,
                resolution_notes=exec_result["output"]
            )
            exec_result["hindsight_event"] = "RETAINED_POSITIVE_MEMORY"
        else:
            # Retain Negative Memory
            self.memory.retain_failed_attempt(
                service=service,
                error_trace=error_trace,
                tool_name=tool,
                args=args,
                failure_reason="Execution failed hard limits during sandbox testing."
            )
            exec_result["status"] = "failed"
            exec_result["hindsight_event"] = "RETAINED_NEGATIVE_MEMORY"

        return exec_result