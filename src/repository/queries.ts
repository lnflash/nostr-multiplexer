import axios from 'axios';
import config from '../../config/config';

// Max username length (NIP-05 spec)
const MAX_NAME_LENGTH = 64;

export const getPubkeyByName = async (
  name: string,
): Promise<string | null> => {
  if (!config.GRAPHQL_URL) {
    throw new Error('MISSING GRAPHQL_URL');
  }

  // Defensive length check before sending to upstream
  if (name.length > MAX_NAME_LENGTH) {
    return null;
  }

  const query = `
    query Query($username: Username!) {
      npubByUsername(username: $username) {
        username
        npub
      }
    }
  `;

  const variables = {username: name};

  try {
    const response = await axios.post(
      config.GRAPHQL_URL,
      {query, variables},
      {
        headers: {'Content-Type': 'application/json'},
        timeout: 3000, // 3s timeout — don't let slow upstream tie up requests
        maxRedirects: 0, // Don't follow redirects
        validateStatus: status => status >= 200 && status < 300,
      },
    );

    const userData = response.data?.data?.npubByUsername;
    return userData ? userData.npub : null;
  } catch (error: any) {
    // Distinguish timeout vs other errors for logging
    if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
      console.error('NIP-05: GraphQL timeout for', name);
    } else {
      console.error(
        'NIP-05: GraphQL error for',
        name,
        error.response?.status || error.message,
      );
    }

    // Throw so controller can return 502 instead of masking as 404
    throw error;
  }
};
