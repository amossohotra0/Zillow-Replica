"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import axios from "axios";
import { IoClose } from "react-icons/io5";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";

// Schema with both email and password fields
const FormSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

type LoginInput = z.infer<typeof FormSchema>;

const LoginForm = () => {
  const router = useRouter();

  const form = useForm<LoginInput>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const useLoginMutation = () =>
    useMutation({
      mutationFn: async (data: LoginInput) => {
        const response = await axios.post("/api/login", data);
        return response.data;
      },
    });

  const loginMutation = useLoginMutation();

  const onSubmit = async (data: LoginInput) => {
    try {
      const response = await loginMutation.mutateAsync(data);
      const userId = response.user.id;
      Cookies.set("token", userId, { expires: 7 });
      router.push("/");
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="md:w-[35%] w-[80%] flex flex-col p-4 bg-white rounded-xl shadow-md">
      <div className="w-full flex items-center justify-between pb-5 border-b">
        <h3 className="text-xl font-semibold">Login</h3>
        <IoClose className="text-lg cursor-pointer" />
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-6 w-full space-y-6"
        >
          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-normal text-gray-500 text-md">
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="johndoe@gmail.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password Field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-normal text-gray-500 text-md">
                  Password
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600"
          >
            {loginMutation.isPending ? "Logging in..." : "Login"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default LoginForm;
