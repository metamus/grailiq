import{c as r}from"./index-BjazyUQ0.js";import{u as e,a as t}from"./api-DwI86ISV.js";/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=r("Layers",[["path",{d:"m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z",key:"8b97xw"}],["path",{d:"m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65",key:"dd6zsq"}],["path",{d:"m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65",key:"ep9fru"}]]);function c(){return e({queryKey:["sets"],queryFn:async()=>{const{data:a}=await t.get("/sets");return a.data}})}function o(a){return e({queryKey:["sets",a],queryFn:async()=>{const{data:s}=await t.get(`/sets/${a}`);return s.data},enabled:!!a})}export{y as L,o as a,c as u};
