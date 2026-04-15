import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl shadow w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Login</h1>
        <LoginForm />
      </div>
    </div>
  );
}
