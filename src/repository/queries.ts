import axios from "axios";
import config from "../../config/config";

interface User {
  name: string;
  pubkey: string;
}

export const getPubkeyByName = async (name: string): Promise<string | null> => {
  const query = `
  query Query($username: Username!) {
    npubByUsername(username: $username) {
      username
      npub
    }
  }
`;
  const variables = {
    username: name,
  };
  try {
    const response = await axios.post(
      config.GRAPHQL_URL,
      {
        query,
        variables,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const userData = response.data.data.npubByUsername;
    return userData ? userData.npub : null;
  } catch (error: any) {
    console.error(
      "Error fetching pubkey:",
      error.response?.data || error.message
    );
    return null;
  }
};
