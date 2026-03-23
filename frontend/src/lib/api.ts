const BASE_URL = "http://localhost:3000/api";

export const api = {
  post : async(path : string,body : object) => {
    const res = await fetch(`${BASE_URL}${path}`,{
      method : "POST",
      headers : {"Content-Type" : "application/json"},
      body : JSON.stringify(body),
    });

    if(!res.ok){
      const err = await res.json();
      throw new Error(err.error || "Request Failed");
    }
    return res.json();
  },
};