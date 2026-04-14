import{c as u,n as r}from"./index-BWHnexPt.js";import{u as s,a}from"./api-DLTyhmoT.js";import{u as n}from"./useMutation-B_JOuwYi.js";/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=u("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);function f(){return s({queryKey:["portfolio"],queryFn:async()=>{const{data:t}=await a.get("/portfolio");return t}})}function p(){const t=r();return n({mutationFn:async e=>{const{data:o}=await a.post("/portfolio",e);return o.data},onSuccess:()=>{t.invalidateQueries({queryKey:["portfolio"]})}})}function d(){const t=r();return n({mutationFn:async e=>{const{data:o}=await a.delete(`/portfolio/${e}`);return o.data},onSuccess:()=>{t.invalidateQueries({queryKey:["portfolio"]})}})}export{y as P,f as a,d as b,p as u};
