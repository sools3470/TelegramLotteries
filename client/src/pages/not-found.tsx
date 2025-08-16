import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="h-full w-full flex items-center justify-center p-4 bg-telegram-bg">
      <Card className="w-full max-w-md shadow-telegram-lg">
        <CardContent className="p-6 text-center">
          <AlertCircle className="mx-auto mb-4 text-telegram-error" size={64} />
          <h1 className="text-2xl font-bold text-telegram mb-2">صفحه یافت نشد</h1>
          <p className="text-telegram-text-secondary mb-6">
            صفحه‌ای که دنبال آن می‌گردید وجود ندارد یا حذف شده است.
          </p>
          <Link href="/">
            <Button className="bg-telegram-blue hover:bg-telegram-blue-dark">
              <Home size={16} className="ml-2" />
              بازگشت به صفحه اصلی
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
