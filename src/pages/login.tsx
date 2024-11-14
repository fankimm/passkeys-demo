import GradientBg from "@/components/page/login/gradient-bg";
import LoginForm from "@/components/page/login/login-form";
import { Alert } from "antd";
import { Verified } from "lucide-react";
import { useState } from "react";

const LoginPage = () => {
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("");
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
        body: JSON.stringify({ action: "registerOptions", userId }),
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
          userId,
          credential,
        }),
      });
      console.log("registerResponse", registerResponse);
      console.log(1);
      if (registerResponse.ok) {
        console.log(2);
        setMessage("Registration successful! You can now login");
      } else {
        console.log(3);
        setMessage("Registration failed.");
      }
    } catch (error) {
      console.error(error);
      setMessage("An error occurred during registration222");
    }
  };

  return (
    <div className="flex min-h-screen bg-white items-centerw-full">
      <div className={`relative hidden w-1/2 lg:block`}>
        <GradientBg className="absolute top-0 left-0 w-full h-full" />
        <img src="/logo.png" className="absolute w-10 h-10 top-5 left-5" alt="logo" />
        <div className="absolute inline-flex items-center gap-1 px-3 py-2 font-semibold text-white border-2 border-white rounded-lg left-5 bottom-5">
          <Verified width={18} height={18} />
          PURPLE ADMIN UI
        </div>
      </div>

      <div className="w-full lg:w-1/2">
        <div className="relative flex items-center justify-center h-full">
          <section className="w-full px-5 pb-10 text-gray-800 sm:w-4/6 md:w-3/6 lg:w-4/6 xl:w-3/6 sm:px-0">
            {!process.env.NEXT_PUBLIC_API_ENDPOINT ? (
              <Alert
                message="환경변수 설정 오류"
                description={
                  <span>
                    .env.example 파일을 복사하여 .env 파일을 생성해주세요.{" "}
                    <a
                      href="https://github.com/purpleio/purple-admin-ui#%EA%B8%B0%EB%B3%B8-%EC%84%A4%EC%A0%95"
                      target="_blank"
                      rel="noreferrer"
                    >
                      참고 링크
                    </a>
                  </span>
                }
                type="error"
                showIcon
                className="my-10"
              />
            ) : null}
            <div className="flex flex-col items-center justify-center px-2 mt-8 sm:mt-0">
              <h2 className="mt-2 text-5xl font-bold leading-tight inter">AWESOME</h2>
              <div className="mt-1 text-lg text-gray-400">Admin System</div>
            </div>
            <button onClick={handleRegister}>passkeys 등록</button>
            <div className="w-full px-2 mt-12 sm:px-6">
              <LoginForm />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
