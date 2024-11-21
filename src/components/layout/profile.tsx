import { useAuth } from "@/lib/auth/auth-provider";
import { Dropdown, MenuProps } from "antd";
import { ChevronDown, KeyRound, LogOut, User } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import React, { useCallback } from "react";

const Profile = () => {
  const { session } = useAuth();
  console.log("session", session);
  const base64ToArrayBuffer = (base64: string) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };
  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer) as any));
  };
  const handleRegister = async () => {
    try {
      // Step 1: Request registration options from the server
      console.log("step2");
      const registerOptionsResponse = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "registerOptions", userId: session.user.login }),
      });
      const registerOptions = await registerOptionsResponse.json();

      // Convert the server response from Base64 into ArrayBuffers
      registerOptions.challenge = base64ToArrayBuffer(registerOptions.challenge);
      registerOptions.user.id = base64ToArrayBuffer(window.btoa(registerOptions.user.id));
      // Step 2: Create a new credential
      const newCredential: PublicKeyCredential = (await navigator.credentials.create({
        publicKey: registerOptions,
      })) as PublicKeyCredential;

      // Prepare the data to be pushed to backend (converting ArrayBuffers back to Base64)
      const credential = {
        id: newCredential.id,
        rawId: btoa(String.fromCharCode(...new Uint8Array(newCredential.rawId))),
        response: {
          attestationObject: arrayBufferToBase64((newCredential.response as any).attestationObject),
          clientDataJSON: arrayBufferToBase64(newCredential.response.clientDataJSON),
        },
        type: newCredential.type,
      };
      console.log("step3");
      // Step 3: Register the credential with the server
      const registerResponse = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "registerCredential",
          userId: session.user.login,
          credential,
        }),
      });
      console.log("registerResponse", registerResponse);
      console.log(1);
      if (registerResponse.ok) {
        console.log(2);
      } else {
        console.log(3);
      }
    } catch (error) {
      console.error(error);
    }
  };
  const handleLogoutClick = useCallback(async () => {
    signOut({ callbackUrl: "/login" });
  }, []);

  const items: MenuProps["items"] = [
    {
      label: (
        <Link href="/sample/profile" className="min-w-[8rem] link-with-icon">
          <User width={16} height={16} />내 프로필
        </Link>
      ),
      key: "0",
    },
    {
      label: (
        <div
          className="link-with-icon"
          onClick={() => {
            handleRegister();
          }}
        >
          <KeyRound width={16} height={16} />
          <div>패스키 등록</div>
        </div>
      ),
      key: "1",
    },
    {
      label: (
        <a onClick={handleLogoutClick} className="link-with-icon">
          <LogOut width={16} height={16} />
          로그아웃
        </a>
      ),
      key: "2",
    },
  ];

  return (
    <>
      <div className="ml-2">Administrator</div>
      <Dropdown menu={{ items }} trigger={["click"]}>
        <button className="flex items-center px-2 text-gray-600 rounded hover:bg-gray-200 enable-transition">
          <span className="sm:max-w-[10rem] ellipsis-text">{session.user.login}</span>
          <ChevronDown className="w-5 h-5" />
        </button>
      </Dropdown>
    </>
  );
};

export default React.memo(Profile);
