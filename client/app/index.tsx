import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button, Icon, Input, Text, makeStyles, useTheme } from "@rneui/themed";
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  PixelRatio,
  ScrollView,
  View,
} from "react-native";
import { useToast } from "../src/providers/Toast";
import LogoSvg from "../src/svg/LogoSvg";
import { trpc } from "../src/utils/trpc";
import { mapBreakpoint } from "../src/utils/responsive";

const useStyles = makeStyles((theme) => ({
  container: {
    position: "relative",
    width: "100%",
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
    paddingVertical: "45%",
  },
  svg: {
    position: "absolute",
    width: "120%",
    height: 200,
    left: mapBreakpoint(["-10%", "-10%", "-15%"]),
    top: mapBreakpoint(["10%", "10%", "20%"]),
  },
  title: {
    fontSize: mapBreakpoint([20, 40, 40]),
    fontWeight: "bold",
  },
  form: {
    top: mapBreakpoint(["20%", "25%","40%"]),
    display: "flex",
    width: "80%",
    gap: 12,
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
  caption: {
    fontSize: 15,
  },
  captionLink: {
    fontSize: 15,
    color: theme.colors.primary,
  },
}));

export default function Index() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme } = useTheme();
  const styles = useStyles();
  const utils = trpc.useContext();

  const [loading, toggle] = useState(false);
  const [state, setState] = useState({
    username: "",
    password: "",
  });

  const login = trpc.user.login.useMutation();

  const handlePress = async () => {
    toggle(true);
    if (
      state.username === "" ||
      state.password === "" ||
      !state.username ||
      !state.password
    ) {
      toggle(false);
      toast.error("Username or password cannot be empty");
      return;
    }

    try {
      const res = await login.mutateAsync({
        username: state.username,
        password: state.password,
      });

      await AsyncStorage.setItem("@jwt", res);

      utils.user.status.invalidate();
      toast.success("Login success");
    } catch (error) {
      toast.error((error as Error).message);
    }
    toggle(false);
  };

  const SVGSIZE = mapBreakpoint(["100%", "100%", "110%"])

  return (
    <KeyboardAvoidingView behavior="position">
      <View style={styles.container}>
        <View style={styles.svg}>
          <LogoSvg width={SVGSIZE} height={SVGSIZE} />
        </View>
        <View style={styles.form}>
          <View style={{ display: 'flex', flexDirection: 'row' }}>
            <Text style={styles.title}>Ma</Text>
            <Text style={[styles.title, {color: theme.colors.primary}]}>puark</Text>
          </View>
          <Input
            leftIcon={
              <Icon name="user" type="feather" color={theme.colors.primary} />
            }
            placeholder="Username"
            inputContainerStyle={styles.input}
            onChangeText={(t) => {
              setState((prev) => ({
                ...prev,
                username: t,
              }));
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
              setState((prev) => ({
                ...prev,
                password: t,
              }));
            }}
          />
          <Button
            onPress={handlePress}
            title="LOGIN"
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
            <Text style={styles.caption}>Don't have an account?</Text>
            <Link href="/signup" style={styles.captionLink}>
              Sign-Up
            </Link>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
