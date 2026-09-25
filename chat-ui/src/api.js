const API_BASE = 'http://localhost:5000';

export async function planTrip(query, conversationId = null) {
  const response = await fetch(`${API_BASE}/api/plan-trip`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, conversationId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to plan trip');
  }

  return data;
}

