import { UserType, Colleges } from "@app/commons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Button,
  Dialog,
  Icon,
  Input,
  Text,
  makeStyles,
  useTheme,
} from "@rneui/themed";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, View, TouchableOpacity } from "react-native";
import { useToast } from "../src/providers/Toast";
import { extractError } from "../src/utils/helper";
import { trpc } from "../src/utils/trpc";
import SignupSvg from "../src/svg/SignupSvg";
import { mapBreakpoint } from "../src/utils/responsive";
import { ScrollView } from "react-native-gesture-handler";

const useStyles = makeStyles((theme) => ({
  container: {
    position: "relative",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
    paddingVertical: "40%",
  },
  svg: {
    width: "70%",
    height: 150,
    top: mapBreakpoint(["-43%", "-43%", "-25%"]),
    left: mapBreakpoint(["0%", "0%", "-5%"]),
  },
  form: {
    top: mapBreakpoint(["-42%", "-42%", "-15%"]),
    display: "flex",
    width: "80%",
    gap: 12,
  },
  title: {
    fontSize: mapBreakpoint([20, 40, 40]),
    fontWeight: "bold",
  },
  caption: {
    fontSize: 15,
  },
  captionLink: {
    fontSize: 15,
    color: theme.colors.primary,
  },
  input: {
    borderColor: theme.colors.primary,
  },
  submit: {
    backgroundColor: theme.colors.primary,
    width: "100%",
  },
  submitLabel: {
    color: theme.colors.white,
    fontSize: 17,
  },
  item: {
    padding: 20,
    fontSize: 80,
  },
}));

type Props = {};
const Signup = (props: Props) => {
  const router = useRouter();
  const styles = useStyles();
  const { toast } = useToast();
  const { theme } = useTheme();
  const utils = trpc.useContext();

  const [open, toggleOpen] = useState(false);
  const [loading, toggle] = useState(false);
  const [state, setState] = useState({
    username: "",
    password: "",
    name: "",
    type: UserType.USER,
    college: Colleges[0]
  });

  const register = trpc.user.register.useMutation();
  const login = trpc.user.login.useMutation();

  const update = (partial: Partial<typeof state>) => {
    setState((prev) => ({
      ...prev,
      ...partial,
    }));
  };

  const handlePress = async () => {
    toggle(true);

    try {
      const res = await register.mutateAsync(state, {
        onError: (err) => {
          toast.error(extractError(err));
        },
        onSuccess: () => {
          toast.success("Register success");
        },
      });

      if (res) {
        const jwt = await login.mutateAsync(state, {
          onError: (err) => {
            toast.error(extractError(err));
            router.push("/");
          },
          onSuccess: () => {
            utils.user.status.invalidate();
            toast.success("Logging in");
            router.push("/");
          },
        });

        await AsyncStorage.setItem("@jwt", jwt);
        return;
      }
    } catch (error) {
      console.error(error);
    }

    toggle(false);
  };

  const SVGSIZE = mapBreakpoint(["100%", "100%", "110%"]);

  return (
    <>
      <Dialog
        isVisible={open}
        onBackdropPress={() => toggleOpen(false)}
        overlayStyle={{
          padding: 0,
          borderRadius: 8,
          width: "90%",
          height: "90%",
        }}
      >
        <ScrollView>
          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              toggleOpen(false);
              update({
                college: undefined,
              });
            }}
          >
            <Text style={{ fontSize: 20 }}>None</Text>
          </TouchableOpacity>
          {(Colleges ?? []).map((v) => (
            <TouchableOpacity
              style={styles.item}
              key={v}
              onPress={() => {
                toggleOpen(false);
                update({ college: v });
              }}
            >
              <Text style={{ fontSize: 20 }}>{v}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Dialog>
      <KeyboardAvoidingView behavior="position">
        <View style={styles.container}>
          <View style={styles.svg}>
            <SignupSvg width={SVGSIZE} height={SVGSIZE} />
          </View>
          <View style={styles.form}>
            <View>
              <Text style={styles.title}>Signup</Text>
            </View>
            <View
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderWidth: 1,
                borderRadius: 8,
                borderColor: theme.colors.primary,
                height: mapBreakpoint([45, 45, 60]),
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  toggleOpen(true);
                }}
              >
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                  }}
                >
                  <Icon
                    color={theme.colors.primary}
                    name="school-outline"
                    type="material-community"
                  />
                  <Text
                    style={{
                      marginLeft: 15,
                      fontSize: 18,
                      flex: 1,
                      ...(!state.college && {
                        color: theme.colors.grey3,
                      }),
                    }}
                  >
                    {state.college ?? "Select College"}
                  </Text>
                  <Icon
                    color={theme.colors.grey3}
                    name="select-arrows"
                    type="entypo"
                    size={15}
                    style={{
                      top: 5,
                    }}
                  />
                </View>
              </TouchableOpacity>
            </View>
            <Input
              leftIcon={
                <Icon
                  name="at-sign"
                  type="feather"
                  color={theme.colors.primary}
                />
              }
              placeholder="Name"
              inputContainerStyle={styles.input}
              onChangeText={(t) => {
                update({ name: t });
              }}
            />
            <Input
              leftIcon={
                <Icon name="user" type="feather" color={theme.colors.primary} />
              }
              placeholder="Username"
              inputContainerStyle={styles.input}
              onChangeText={(t) => {
                update({ username: t });
              }}
            />
            <Input
              leftIcon={
                <Icon name="lock" type="feather" color={theme.colors.primary} />
              }
              textContentType="password"
              secureTextEntry
              placeholder="Password"
              inputContainerStyle={styles.input}
              onChangeText={(t) => {
                update({ password: t });
              }}
            />
            <Button
              onPress={handlePress}
              title="SIGNUP"
              type="outline"
              buttonStyle={styles.submit}
              titleStyle={styles.submitLabel}
              disabled={loading}
            />
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                gap: 4,
                alignSelf: "flex-start",
              }}
            >
              <Text style={styles.caption}>Have an account?</Text>
              <Link href="/" style={styles.captionLink}>
                Login
              </Link>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
};
export default Signup;
