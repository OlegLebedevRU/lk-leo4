import axios from "axios";
import mem from "memoize";

const refreshTokenFn = async () =>{
//   const session = JSON.parse(localStorage.getItem("session"));
    console.log("try refreshToken");
  try {
    await axios.get("https://dev.leo4.ru/private/refresh/", {
        withCredentials:true, headers: {
            "Content-Type": "application/json",
     },} );

    // const { session } = response.data;
    
    return true;
  } catch (error) {
//
    console.log("error refreshToken", error);
    return false;
  }
};

// refreshToken debouncer in milliseconds
const maxAge = 10000;

export const memoizedRefreshToken = mem(refreshTokenFn, {
  maxAge,
});