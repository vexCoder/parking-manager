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
          icon: "qrcode",
          iconType: "ant-design",
          text: "QR",
          handlePress: () => {
            router.push("/home/user/qr");
          },
        }}
        left={{
          icon: "car",
          iconType: "ant-design",
          text: "Parking",
          handlePress: () => {
            router.push("/home/user/parking");
          },
        }}
      />
    </>
  );
}
