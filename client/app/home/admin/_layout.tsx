import { Slot, useRouter } from "expo-router";
import BottomBar from "../../../src/components/BottomBar";
import TopBar from "../../../src/components/TopBar";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Layout() {
  const router = useRouter();
  return (
    <>
      <SafeAreaView>
        <TopBar />
        <Slot />
      </SafeAreaView>
      <BottomBar
        right={{
          icon: "list",
          iconType: "feather",
          text: "Logs",
          handlePress: () => {
            router.push("/home/admin/logs");
          },
        }}
        left={{
          icon: "car",
          iconType: "ant-design",
          text: "Parking",
          handlePress: () => {
            router.push("/home/admin/parking");
          },
        }}
        main={{
          icon: "qrcode",
          iconType: "ant-design",
          handlePress: () => {
            router.push("/home/admin/qr");
          },
        }}
      />
    </>
  );
}
