import React from "react";
import { FaArrowLeft } from "react-icons/fa";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export function AccountShell({ title, children, right, onBack }) {
  return (
    <>
      <style>{`
        // .ok-page{min-height:100vh;background:#f6f7fb;color:#17181d;font-family:Inter,Roboto,system-ui,sans-serif;padding-bottom:32px}
   .ok-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;

  width: 100%;
  height: 60px;
  margin-bottom: 30px;
  z-index: 2147483647;

  background: rgba(255, 255, 255, 0.94);

  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);

  border-bottom: 1px solid #e8e8ef;

  display: flex;
  align-items: center;

  padding: 0 14px;
  gap: 10px;

  box-sizing: border-box;
}


.ok-wrap {
  width: 100%;
  max-width: 640px;

  margin: 0 auto;

  /* Space for fixed navbar */
  padding: 78px 16px 0;

  box-sizing: border-box;
}
        .ok-back,.ok-icon-btn{width:42px;height:42px;border:0;background:transparent;border-radius:50%;display:grid;place-items:center;color:#4b4d58;cursor:pointer}
        .ok-back:hover,.ok-icon-btn:hover{background:#f0f0f5}
        .ok-title{font-size:18px;font-weight:750;flex:1}
        .ok-wrap{max-width:640px;margin:auto;padding:0 16px}
        .ok-card{background:#fff;border:1px solid #e8e8ef;border-radius:20px;box-shadow:0 2px 12px rgba(20,20,40,.05)}
        .ok-section{margin-top:22px}
        .ok-label{font-size:12px;text-transform:uppercase;letter-spacing:.08em;font-weight:750;color:#777987;margin:0 4px 9px}
        .ok-btn{min-height:46px;border:0;border-radius:14px;padding:0 18px;font-weight:700;cursor:pointer}
        .ok-primary{background:#4f46e5;color:#fff}.ok-primary:hover{background:#4338ca}
        .ok-secondary{background:#eeedff;color:#3730a3}
        .ok-outline{background:#fff;border:1px solid #d9d9e4;color:#343641}
        .ok-danger{background:#b91c1c;color:#fff}
        .ok-full{width:100%}
        .ok-input{width:100%;height:48px;border:1px solid #dedee8;border-radius:13px;background:#fff;padding:0 14px;font-size:14px;outline:none}
        .ok-input:focus{border-color:#4f46e5;box-shadow:0 0 0 3px rgba(79,70,229,.1)}
        .ok-field{margin-bottom:15px}.ok-field label{display:block;font-size:12px;font-weight:700;color:#626470;margin:0 0 7px}
        .ok-row{display:flex;align-items:center;gap:12px}.ok-grow{flex:1;min-width:0}
        .ok-muted{color:#737582;font-size:13px}.ok-small{font-size:12px;color:#777987}
        .ok-empty{text-align:center;padding:48px 20px}.ok-empty h3{margin:12px 0 5px;font-size:17px}.ok-empty p{margin:0;color:#777987;font-size:13px}
        .ok-list{overflow:hidden}.ok-list-item{display:flex;align-items:center;gap:13px;padding:15px 16px;border-bottom:1px solid #eeeeF3;cursor:pointer;background:#fff}.ok-list-item:last-child{border-bottom:0}
        .ok-avatar{width:72px;height:72px;border-radius:18px;object-fit:cover;background:#eee}.ok-circle{width:44px;height:44px;border-radius:14px;background:#eeedff;color:#4f46e5;display:grid;place-items:center;flex:none}
        .ok-chip{display:inline-flex;align-items:center;border-radius:999px;padding:5px 10px;font-size:11px;font-weight:750;background:#eeeef8;color:#5b5d68}
        .ok-chip.success{background:#dcfce7;color:#166534}.ok-chip.warn{background:#fef3c7;color:#92400e}.ok-chip.danger{background:#fee2e2;color:#991b1b}
        .ok-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
        @media(max-width:420px){.ok-grid{grid-template-columns:1fr}.ok-wrap{padding:0 12px}}
        /* =====================================================
   PROFILE HEADER
===================================================== */

.ok-profile-header {
  display: flex;
  align-items: center;

  width: 100%;

  gap: 20px;

  padding: 26px 24px;
  margin-bottom: 28px;

  box-sizing: border-box;

  border-radius: 22px;

  background:
    linear-gradient(
      135deg,
      #ffffff 0%,
      #f8faff 100%
    );

  border: 1px solid #edf0f5;

  box-shadow:
    0 8px 28px rgba(15, 23, 42, 0.06);
}


/* =====================================================
   PROFILE IMAGE
===================================================== */

.ok-profile-image-wrap {
  flex-shrink: 0;

  width: 92px;
  height: 92px;

  padding: 3px;

  display: flex;
  align-items: center;
  justify-content: center;

  box-sizing: border-box;

  border-radius: 50%;

  background:
    linear-gradient(
      135deg,
      #6366f1,
      #8b5cf6,
      #3b82f6
    );

  box-shadow:
    0 8px 22px rgba(79, 70, 229, 0.18);
}


.ok-profile-image {
  display: block;

  width: 86px;
  height: 86px;

  max-width: 86px;
  max-height: 86px;

  object-fit: cover;
  object-position: center;

  border-radius: 50%;

  border: 4px solid #ffffff;

  box-sizing: border-box;
}


/* =====================================================
   PROFILE INFO
===================================================== */

.ok-profile-info {
  min-width: 0;

  flex: 1;

  display: flex;
  flex-direction: column;

  justify-content: center;
}


.ok-profile-name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  gap: 9px;

  margin-bottom: 6px;
}


.ok-profile-name-row h2 {
  margin: 0;

  color: #111827;

  font-size: 24px;

  line-height: 1.2;

  font-weight: 800;

  letter-spacing: -0.5px;
}


/* =====================================================
   EMAIL
===================================================== */

.ok-profile-info .ok-muted {
  margin: 0;

  color: #64748b;

  font-size: 13px;

  font-weight: 500;

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;
}


/* =====================================================
   CHIPS
===================================================== */

.ok-profile-chips {
  display: flex;
  align-items: center;

  gap: 7px;

  margin-top: 10px;

  flex-wrap: wrap;
}


.ok-chip {
  display: inline-flex;
  align-items: center;

  gap: 5px;

  padding: 5px 9px;

  border-radius: 999px;

  background: #f1f5f9;

  color: #64748b;

  border: 1px solid #e2e8f0;

  font-size: 10px;

  line-height: 1;

  font-weight: 700;
}


.ok-chip.success {
  background: #ecfdf5;

  color: #047857;

  border-color: #d1fae5;
}


/* =====================================================
   HOVER
===================================================== */

.ok-profile-header {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.ok-profile-header:hover {
  transform: translateY(-1px);

  box-shadow:
    0 12px 34px rgba(15, 23, 42, 0.08);
}


/* =====================================================
   MOBILE
===================================================== */

@media (max-width: 600px) {

  .ok-profile-header {
    gap: 15px;

    padding: 20px 16px;

    border-radius: 18px;
  }

  .ok-profile-image-wrap {
    width: 76px;
    height: 76px;
  }

  .ok-profile-image {
    width: 70px;
    height: 70px;

    max-width: 70px;
    max-height: 70px;
  }

  .ok-profile-name-row {
    gap: 6px;
  }

  .ok-profile-name-row h2 {
    font-size: 19px;
  }

  .ok-profile-info .ok-muted {
    font-size: 11px;
  }

  .ok-profile-chips {
    margin-top: 8px;
  }

  .ok-chip {
    padding: 4px 8px;

    font-size: 9px;
  }
}
      `}</style>
      <div className="ok-page">
        <header className="ok-bar">
          <button className="ok-back" onClick={onBack || (()=>window.history.back())} aria-label="Back"><FaArrowLeft size={15}/></button>
          <div className="ok-title">{title}</div>
          {right}
        </header>
        <main className="ok-wrap">{children}</main>
      </div>
    </>
  );
}

export function authHeaders(json=false){
  const h={Authorization:`Bearer ${localStorage.getItem("token")}`};
  if(json) h["Content-Type"]="application/json";
  return h;
}

export async function api(path, options={}){
  const res=await fetch(`${BACKEND_URL}${path}`,{...options,headers:{...authHeaders(options.body && typeof options.body==="string"),...(options.headers||{})}});
  let data={};
  try{data=await res.json()}catch(error){
      console.error(error);
  }
  if(!res.ok) throw new Error(data.message||"Request failed");
  return data;
}
