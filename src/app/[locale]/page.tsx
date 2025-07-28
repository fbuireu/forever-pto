import { Countries } from "@ui/modules/components/core/Countries";
import { Header } from "@ui/modules/components/core/Header";
import { Regions } from "@ui/modules/components/core/Regions";
import { StoreInitializer } from "@ui/modules/components/store/StoreInitializer";
import { Locale } from "next-intl";
import { cookies } from "next/headers";

export const runtime = "edge";

interface ForeverPtoProps {
  params: Promise<{ locale: Locale }>;
}

const ForeverPto = async ({ params }: ForeverPtoProps) => {
  const { locale } = await params;
  const cookieStore = await cookies();
  const userCountry = cookieStore.get('user-country')?.value;

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <StoreInitializer userCountry={userCountry} locale={locale} />
       <h1>Hello world {locale}/{userCountry}</h1>
       <Header />
       <Countries />
       <Regions />
    </div>
  );
};

export default ForeverPto;
