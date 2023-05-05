import { Text } from "@rneui/themed";
import { trpc } from "../../../../src/utils/trpc";
import { View, Dimensions } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

export default function Index() {
  const _logs = trpc.user.getLogs.useQuery();

  const logs = _logs.data ?? [];

  const dimHeight = Dimensions.get("window").height;

  return (
    <ScrollView
      style={{
        maxHeight: dimHeight - 40 - 90,
      }}
    >
      <View
        style={{
          height: dimHeight - 40 - (logs.length * 40) - 200,
        }}
      >
        {logs.map((log, i) => {
          return (
            <View
              key={i}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                padding: 20,
                borderBottomColor: "#ccc",
                borderBottomWidth: 1,
                ...(i === 0 && {
                  borderTopColor: "#ccc",
                  borderTopWidth: 1,
                }),
                ...(i % 2 === 0 && {
                  backgroundColor: "#f5f5f5",
                }),
              }}
            >
              <Text style={{flex: 1}}>{log.id}</Text>
              <Text style={{flex: 1}}>{log.type}</Text>
              <Text style={{flex: 1}}>{log.action}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
