// Local-only context: no cookie, request, authentication or server imports.
import React,{createContext,useContext} from 'react';
const Context=createContext({locale:'ar-EG',dir:'rtl'});
export function LocaleProvider({effectiveLocale,children}:any){return <Context.Provider value={{locale:effectiveLocale,dir:effectiveLocale==='en'?'ltr':'rtl'}}>{children}</Context.Provider>}
export const useLocale=()=>useContext(Context);
