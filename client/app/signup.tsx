import { UserType } from "@app/commons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button, Icon, Input, Text, makeStyles, useTheme } from "@rneui/themed";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, View } from "react-native";
import { useToast } from "../src/providers/Toast";
import { extractError } from "../src/utils/helper";
import { trpc } from "../src/utils/trpc";
import SignupSvg from "../src/svg/SignupSvg";
import { mapBreakpoint } from "../src/utils/responsive";

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
    height: 200,
    top: mapBreakpoint(["-43%", "-43%", "-25%"]),
    left: mapBreakpoint(["0%", "0%", "-5%"]),
  },
  form: {
    top: mapBreakpoint(["-47%", "-47%","-15%"]),
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
    marginTop: 20,
  },
  submitLabel: {
    color: theme.colors.white,
    fontSize: 17,
  },
}));

type Props = {};
const Signup = (props: Props) => {
  const router = useRouter();
  const styles = useStyles();
  const { toast } = useToast();
  const { theme } = useTheme();
  const utils = trpc.useContext();

  const [loading, toggle] = useState(false);
  const [state, setState] = useState({
    username: "",
    password: "",
    name: "",
    type: UserType.USER,
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
            router.push("/home/user/parking");
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

  const SVGSIZE = mapBreakpoint(["100%", "100%", "110%"])

  return (
    <KeyboardAvoidingView behavior="position">
      <View style={styles.container}>
        <View style={styles.svg}> 
          <SignupSvg width={SVGSIZE} height={SVGSIZE} />
        </View>
        <View style={styles.form}>
          <View >
            <Text style={styles.title}>Signup</Text>
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
  );
};
export default Signup;
