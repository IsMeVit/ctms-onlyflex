import Cookies from "js-cookie";

type ApiResponse<T = any> = {
  success: boolean;
  status: number;
  data: T;
  errors: any;
};

const apiService = async (
  url: string,
  config: RequestInit = {}
): Promise<ApiResponse> => {
  const ftb_supportdesk_api = process.env.ftb_supportdesk_api || "";

  const authTokens = Cookies.get("authTokens")
    ? JSON.parse(Cookies.get("authTokens") as string)
    : null;

  const contentHeader =
    (config.headers as Record<string, string>)?.["Content-Type"] ||
    "application/json";

  config.headers = {
    Authorization: `Bearer ${authTokens?.access}`,
    "Content-Type": contentHeader,
    ...(config.headers || {}),
  };

  // Remove Content-Type for multipart/form-data
  if (contentHeader === "multipart/form-data") {
    delete (config.headers as Record<string, string>)["Content-Type"];
  }

  let response: ApiResponse = {
    success: true,
    status: 200,
    data: {},
    errors: null,
  };

  try {
    // If calling local Next.js API routes, include credentials so server-side auth (next-auth) can read cookies.
    if (!ftb_supportdesk_api && (config.credentials === undefined)) {
      (config as RequestInit).credentials = 'include';
    }

    const res = await fetch(`${ftb_supportdesk_api}${url}`, config);
    response.status = res.status;
    if (!res.ok) response.success = false;

    // For DELETE, don't parse JSON
    if (config.method?.toLowerCase() === "delete") {
      response.data = {};
    } else {
      const result = await res.json();
      if (response.success) {
        response.data = result;
      } else {
        response.errors = result;
      }
    }
  } catch (error) {
    response = {
      success: false,
      status: 500,
      data: {},
      errors: {
        message: "Connection to API Failed or Timed Out!",
        error,
      },
    };
    console.error("API Error:", error);
  }
  return response;
};

export default apiService;

export const fetchFile = async (url: string) => {
  try {
    const authTokens = Cookies.get("authTokens")
      ? JSON.parse(Cookies.get("authTokens") as string)
      : null;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${authTokens?.access}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error("Error fetching the file:", error);
    throw error;
  }
};


