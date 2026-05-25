const API_BASE_URL = 'https://wizard-world-api.herokuapp.com';

export async function fetchExternalElixirs() {
  console.log('--- API: Fetching elixirs... ---');
  
  const response = await fetch(`${API_BASE_URL}/Elixirs`);
  
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }

  const data = await response.json();
  console.log(`--- API: Successfully retrieved ${data.length} elixirs ---`);
  
  return data;
}