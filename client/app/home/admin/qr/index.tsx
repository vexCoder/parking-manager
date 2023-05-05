import { Text, makeStyles } from "@rneui/themed";
import { BarCodeScanner, BarCodeScannedCallback } from "expo-barcode-scanner";
import React, { useEffect, useState } from "react";
import { View, Dimensions } from "react-native";
import { trpc } from "../../../../src/utils/trpc";
import { useToast } from "../../../../src/providers/Toast";
import { extractError } from "../../../../src/utils/helper";

const useStyles = makeStyles((theme) => ({
  container: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  qr: {
    width: "100%",
    height: "100%",
    zIndex: 1,
    top: -60,
  },
  overlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 5,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  targetTopLeft: {
    position: "absolute",
    top: "20%",
    left: "30%",
  },
  targetTopLeft1: {
    width: 5,
    height: 50,
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
  },
  targetTopLeft2: {
    top: -50,
    width: 50,
    height: 5,
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
  },
  targetTopRight: {
    position: "absolute",
    top: "20%",
    right: "30%",
  },
  targetTopRight1: {
    width: 5,
    height: 50,
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
    right: -45,
  },
  targetTopRight2: {
    top: -50,
    width: 50,
    height: 5,
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
  },
  targetBottomLeft: {
    position: "absolute",
    top: "35%",
    left: "30%",
  },
  targetBottomLeft1: {
    width: 5,
    height: 50,
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
  },
  targetBottomLeft2: {
    width: 50,
    height: 5,
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
    top: -5,
  },
  targetBottomRight: {
    position: "absolute",
    top: "35%",
    right: "30%",
  },
  targetBottomRight1: {
    width: 5,
    height: 50,
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
    right: -45,
  },
  targetBottomRight2: {
    top: -5,
    width: 50,
    height: 5,
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
  },
}));

export default function Index() {
  const { toast } = useToast();
  const styles = useStyles();
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [loading, toggleLoading] = useState<boolean>(false);
  const utils = trpc.useContext();

  const log = trpc.user.log.useMutation();

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getBarCodeScannerPermissions();
  }, []);

  const handleBarCodeScanned: BarCodeScannedCallback = async ({
    type,
    data,
  }) => {
    toggleLoading(true);

    if (loading) return;

    if ((type as unknown as number) !== 256) {
      toast.error('Incorrect Qr')
      setTimeout(() => {
        toggleLoading(false);
      }, 1500);
      return;
    }

    try {
      const res = await log.mutateAsync(
        {
          reference: data,
        },
        {
          onError: (err) => {
            toast.error(extractError(err));
          },
          onSuccess: () => {
            // utils.status.invalidate();
            toast.success("Logged");
          },
        }
      );
    } catch (error) {
      console.error(error);
    }

    setTimeout(() => {
      toggleLoading(false);
    }, 1500);
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  const screenWidth = Dimensions.get("window").width;

  return (
    <View style={styles.container}>
      <View style={styles.overlay}>
        <View style={styles.targetTopLeft}>
          <View style={styles.targetTopLeft1} />
          <View style={styles.targetTopLeft2} />
        </View>
        <View style={styles.targetTopRight}>
          <View style={styles.targetTopRight1} />
          <View style={styles.targetTopRight2} />
        </View>
        <View style={styles.targetBottomLeft}>
          <View style={styles.targetBottomLeft1} />
          <View style={styles.targetBottomLeft2} />
        </View>
        <View style={styles.targetBottomRight}>
          <View style={styles.targetBottomRight1} />
          <View style={styles.targetBottomRight2} />
        </View>
      </View>
      <BarCodeScanner
        onBarCodeScanned={loading ? undefined : handleBarCodeScanned}
        style={styles.qr}
      />
    </View>
  );
}
