import { SigninForm } from "@/components/auth/signin-form";

const SignInPage = () => {
  return (

    <div className="bg-muted relative z-0 flex min-h-screen w-full flex-col items-center justify-center bg-gradient-purple p-4 sm:p-6 md:p-10">
   
      <div className="w-full max-w-sm md:max-w-4xl">
        <SigninForm />
      </div>
      
    </div>
  );
};

export default SignInPage;