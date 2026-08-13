import os
import json
from typing import List, Dict, Any

try:
    from hindsight import HindsightClient
except ImportError:  # pragma: no cover
    HindsightClient = None

class HindsightMemoryEngine:
    def __init__(self, api_key: str):
        self.client = HindsightClient(api_key=api_key) if HindsightClient is not None else None
        self.bank_id = "incident-brain-devops"

    def retain_successful_fix(self, service: str, error_trace: str, tool_name: str, args: Dict[str, Any], resolution_notes: str):
        """Stores verified positive resolution pathways into Hindsight."""
        if self.client is None:
            return {"status": "local-mock", "event": "POSITIVE_REMEDIATION"}

        payload = {
            "type": "POSITIVE_REMEDIATION",
            "service": service,
            "error_trace": error_trace,
            "recommended_tool": tool_name,
            "tool_arguments": args,
            "resolution_notes": resolution_notes
        }
        self.client.retain(
            bank_id=self.bank_id,
            content=json.dumps(payload),
            metadata={"service": service, "type": "positive"}
        )

    def retain_failed_attempt(self, service: str, error_trace: str, tool_name: str, args: Dict[str, Any], failure_reason: str):
        """Stores negative memory patterns to suppress repeating failed fixes."""
        if self.client is None:
            return {"status": "local-mock", "event": "NEGATIVE_REINFORCEMENT"}

        payload = {
            "type": "NEGATIVE_REINFORCEMENT",
            "service": service,
            "error_trace": error_trace,
            "failed_tool": tool_name,
            "failed_arguments": args,
            "failure_reason": failure_reason
        }
        self.client.retain(
            bank_id=self.bank_id,
            content=json.dumps(payload),
            metadata={"service": service, "type": "negative"}
        )

    def recall_incident_context(self, service: str, error_trace: str) -> List[Dict[str, Any]]:
        """Recalls both positive and negative memories matching the error signature."""
        if self.client is None:
            return [{
                "type": "NEGATIVE_REINFORCEMENT",
                "service": service,
                "error_trace": error_trace,
                "failure_reason": "No Hindsight SDK configured; running local fallback memory mode."
            }]

        query_str = f"Service: {service} | Trace: {error_trace}"
        memories = self.client.recall(
            bank_id=self.bank_id,
            query=query_str,
            top_k=3
        )
        
        parsed_memories = []
        for item in memories:
            try:
                parsed_memories.append(json.loads(item.text))
            except json.JSONDecodeError:
                parsed_memories.append({"raw_content": item.text})
                
        return parsed_memories