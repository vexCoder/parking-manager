import { Icon, Text, useTheme } from "@rneui/themed";
import { View, TouchableHighlight } from "react-native";
import { mapBreakpoint } from "../utils/responsive";

type Props = {
  left?: {
    icon: string;
    text: string;
    iconType: string;
    handlePress: () => void;
  };
  right?: {
    icon: string;
    text: string;
    iconType: string;
    handlePress: () => void;
  };
  main?: {
    icon: string;
    iconType: string;
    handlePress: () => void;
  };
};

const BottomBar = ({ left, right, main }: Props) => {
  const { theme } = useTheme();

  const BUTTONSIZE = mapBreakpoint([60, 60, 60])
  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        flex: 1,
        width: "100%",
      }}
    >
      <View
        style={{
          width: "100%",
          backgroundColor: theme.colors.primary,
          borderTopWidth: 1.5,
          borderColor: theme.colors.primary,
          position: "relative",
          shadowOffset: { width: 10, height: 10 },
          shadowColor: "black",
          shadowOpacity: 1,
          elevation: 5,
        }}
      >
        {main && (
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              width: "100%",
              position: "absolute",
              top: -40,
              zIndex: 5,
            }}
          >
            <TouchableHighlight
              underlayColor="black"
              onPress={main.handlePress}
              style={{
                borderRadius: 9999,
                zIndex: 5,
              }}
            >
              <View
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  borderRadius: 9999,
                  padding: 15,
                  borderWidth: 4,
                  borderColor: theme.colors.primary,
                  backgroundColor: "white",
                  zIndex: 0,
                }}
              >
                <Icon
                  color={theme.colors.primary}
                  size={48}
                  name={main.icon}
                  type={main.iconType}
                  style={{ zIndex: -1 }}
                />
              </View>
            </TouchableHighlight>
          </View>
        )}
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            padding: 5,
            paddingHorizontal: "10%",
            width: "100%",
            justifyContent: "space-between",
            zIndex: 5,
          }}
        >
          <TouchableHighlight
            underlayColor="rgba(0,0,0,0.2)"
            onPress={left?.handlePress}
            style={{
              borderRadius: 9999,
              zIndex: 5,
            }}
          >
            <View
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: BUTTONSIZE,
                height: BUTTONSIZE,
              }}
            >
              {left && (
                <>
                  <Icon
                    color={theme.colors.white}
                    name={left.icon}
                    type={left.iconType}
                  />
                  <Text style={{ color: theme.colors.white }}>{left.text}</Text>
                </>
              )}
            </View>
          </TouchableHighlight>
          <TouchableHighlight
            underlayColor="rgba(0,0,0,0.2)"
            onPress={right?.handlePress}
            style={{
              borderRadius: 9999,
              zIndex: 5,
            }}
          >
          <View
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: BUTTONSIZE,
              height: BUTTONSIZE,
            }}
          >
            {right && (
              <>
                <Icon
                  color={theme.colors.white}
                  name={right.icon}
                  type={right.iconType}
                />
                <Text style={{ color: theme.colors.white }}>{right.text}</Text>
              </>
            )}
          </View>
          </TouchableHighlight>
        </View>
      </View>
    </View>
  );
};
export default BottomBar;
