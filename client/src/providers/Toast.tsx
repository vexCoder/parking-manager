import { createContext, useContext } from "react";
import RNToast, {
  ToastOptions as RNToastOptions,
} from "react-native-root-toast";
import { useTheme } from "@rneui/themed";
import { ViewStyle } from "react-native";

type ToastOptions = RNToastOptions & {
  containerStyle?: ViewStyle;
};

type ToastContextValue = {
  toast: {
    error: (message: string, opts?: ToastOptions) => void;
    success: (message: string, opts?: ToastOptions) => void;
  };
};

const ToastContext = createContext({} as ToastContextValue);

type Props = {
  children: React.ReactNode;
};

const ToastProvider = ({ children }: Props) => {
  const { theme } = useTheme();

  const toast = {
    error: (message: string, opts: ToastOptions = {}) => {
      RNToast.show(message, {
        duration: RNToast.durations.LONG,
        position: RNToast.positions.TOP,
        ...opts,
        containerStyle: {
          backgroundColor: theme.colors.error,
          borderRadius: 8,
          padding: 10,
          width: "80%",
          ...(opts.containerStyle as ViewStyle),
        },
      });
    },
    success: (message: string, opts: ToastOptions = {}) => {
      RNToast.show(message, {
        duration: RNToast.durations.LONG,
        position: RNToast.positions.TOP,
        ...opts,
        containerStyle: {
          backgroundColor: theme.colors.success,
          borderRadius: 8,
          padding: 10,
          width: "80%",
          ...(opts.containerStyle as ViewStyle),
        },
      });
    },
  };
  return (
    <ToastContext.Provider value={{ toast }}>{children}</ToastContext.Provider>
  );
};

export const useToast = () => {
  const context: ToastContextValue = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("Context must be used within a ToastProvider");
  }
  return context;
};

export default ToastProvider;
