import { Text } from "@rneui/themed";
import { View, Dimensions } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { trpc } from "../../../../src/utils/trpc";

type Props = {};
const index = (props: Props) => {
  const _status = trpc.user.status.useQuery(undefined, {
    retry: false,
    refetchOnMount: false,
  });

  const status = _status.data;

  const height = Dimensions.get("window").height;

  if (!status) return null;
  return (
    <View
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: (height * 0.75) - 50 - 70,
        gap: 40,
      }}
    >
      <View
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 20 }}>Scan this QR Code</Text>
        <Text style={{ fontSize: 20 }}>to enter/exit the parking lot</Text>
      </View>
      <QRCode value={status.reference} />
    </View>
  );
};
export default index;
