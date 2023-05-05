import AsyncStorage from "@react-native-async-storage/async-storage";
import { Icon, Text, useTheme } from "@rneui/themed";
import { useRouter } from "expo-router";
import { View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { trpc } from "../utils/trpc";

type Props = {};
const TopBar = (props: Props) => {
  const { theme } = useTheme();
  const router = useRouter()

  const ctx = trpc.useContext();

  const logout = async () => {
    await AsyncStorage.setItem("@jwt", "");
    router.replace("/");
    ctx.user.status.invalidate();
    ctx.user.status.reset(undefined, {})
  };

  return (
    <View
      style={[
        {
          top: 0,
          width: "100%",
          height: 50,
          backgroundColor: theme.colors.primary,
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 10,
          zIndex: 10,
        },
      ]}
    >
      <Text
        style={{
          color: theme.colors.background,
          fontSize: 20,
        }}
      >
        Mapuark
      </Text>
      <TouchableOpacity onPress={logout}>
        <Icon name="logout" type="material-icons" color="white" />
      </TouchableOpacity>
    </View>
  );
};
export default TopBar;
