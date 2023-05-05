import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Slot } from "expo-router";
import { trpc } from "../src/utils/trpc";
import { useEffect, useState } from "react";
import { httpBatchLink } from "@trpc/client";
import { ThemeProvider, createTheme } from "@rneui/themed";
import { RootSiblingParent } from "react-native-root-siblings";
import ToastProvider from "../src/providers/Toast";
import AsyncStorage, { useAsyncStorage } from "@react-native-async-storage/async-storage";
import AuthGuard from "../src/providers/AuthGuard";
import { PixelRatio } from "react-native";
import { mapBreakpoint } from "../src/utils/responsive";

let STANDARD_HEIGHT = [50, 50, 60]

const theme = createTheme({
  components: {
    Input: (props, theme) => ({
      containerStyle: {
        height: mapBreakpoint(STANDARD_HEIGHT),
        paddingHorizontal: 0,
        width: "100%",
      },
      inputContainerStyle: {
        height: "100%",
        borderRadius: 8,
        borderWidth: 1,
      },
      inputStyle: {
        paddingLeft: 20,
        paddingRight: 20,
      },
      ...(!!props.leftIcon && {
        inputStyle: {
          paddingLeft: 10,
        },
        leftIconContainerStyle: {
          paddingLeft: 20,
        },
      }),
      ...(!!props.rightIcon && {
        inputStyle: {
          paddingRight: 10,
        },
        rightIconContainerStyle: {
          paddingRight: 20,
        },
      }),
    }),
    Button: {
      buttonStyle: {
        height: mapBreakpoint(STANDARD_HEIGHT),
        borderRadius: 8,
        borderWidth: 1,
      },
    },
  },
});

export default function Layout() {
  const { getItem, setItem } = useAsyncStorage("@jwt");
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "http://mapuark.site/trpc",
          // You can pass any HTTP headers you wish here
          async headers() {
            return {
              authorization: `Bearer ${await getItem()}`,
            };
          },
        }),
      ],
    })
  );

  useEffect(() => {
    // AsyncStorage.setItem("@jwt", "");
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <RootSiblingParent>
            <ToastProvider>
              <AuthGuard>
                <Slot />
              </AuthGuard>
            </ToastProvider>
          </RootSiblingParent>
        </QueryClientProvider>
      </trpc.Provider>
    </ThemeProvider>
  );
}
