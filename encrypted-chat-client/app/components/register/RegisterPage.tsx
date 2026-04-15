import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl shadow w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Create account</h1>
        <RegisterForm />
      </div>
    </div>
  );
}
