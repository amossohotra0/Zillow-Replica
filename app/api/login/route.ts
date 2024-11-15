import { NextRequest, NextResponse } from "next/server";

type User = {
  id: string;
  email: string;
  password: string;
};

const users = process.env.ZILLOW_USERS as unknown as string;
let parsedUsers: User[] = [];

try {
  parsedUsers = users ? JSON.parse(users) as User[] : [];
} catch (error) {
  console.error('Failed to parse ZILLOW_USERS:', error);
  parsedUsers = [];
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      {
        message: "Email and password are required.",
      },
      { status: 500 }
    );
  }

  const user = parsedUsers?.find(
    (u) => u?.email === email && u?.password === password
  );

  if (!user) {
    return NextResponse.json(
      { message: "Invalid credentials." },
      { status: 400 }
    );
  }

  return Response.json(
    {
      message: "Login successful!",
      user: { id: user.id, email: user.email },
    },
    { status: 200 }
  );
}
