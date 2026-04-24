const BASE_URL = import.meta.env.VITE_API_URL;

export const api = {
  
  post: async (path: string, body: object) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json" ,
        "Authorization" : `Bearer ${token}`
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Request Failed");
    }
    return res.json();
  },

  get: async (path: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Request Failed");
    }
    return res.json();
  },

  patch: async (path : string, body : object) => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${BASE_URL}${path}`,{
      method : "PATCH",
      headers : {
        "Content-Type" : "application/json",
        "Authorization" : `Bearer ${token}`
      },
      body : JSON.stringify(body),
    });
    if(!res.ok){
      const err = await res.json();
      throw new Error(err.error || "Request Failed");
    }

    return res.json();
  }, 

  delete: async (path: string) => {
    const token = localStorage.getItem("token");
    
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
      
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Request Failed");
    }
    return res.json();
  },
};