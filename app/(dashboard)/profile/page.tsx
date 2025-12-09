"use client";

import { useQuizBoltStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function ProfilePage() {
  const { profile, setProfile } = useQuizBoltStore();
  const [name, setName] = useState(profile?.name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");

  const handleSave = () => {
    setProfile({ id: profile?.id ?? "demo-user", name, email });
  };

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h1 className="text-xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Update your basic account information.
        </p>
      </div>
      <div className="space-y-4 rounded-xl border bg-card p-4">
        <div className="space-y-1">
          <label className="text-xs font-medium">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Email</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button type="button" onClick={handleSave}>
          Save changes
        </Button>
      </div>
    </div>
  );
}
