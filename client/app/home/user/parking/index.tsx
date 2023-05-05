import {
  Button,
  Dialog,
  Icon,
  Input,
  Text,
  makeStyles,
  useTheme,
} from "@rneui/themed";
import {
  View,
  ScrollView,
  Dimensions,
  PanResponder,
  SafeAreaView,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from "react-native";
import { useState, useEffect, Fragment } from "react";
import { trpc } from "../../../../src/utils/trpc";
import Animated, {
  WithSpringConfig,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import {
  PanGestureHandler,
  LongPressGestureHandler,
} from "react-native-gesture-handler";
import { Picker } from "@react-native-picker/picker";
import _ from "lodash";
import { mapBreakpoint } from "../../../../src/utils/responsive";
import { inferAsyncReturnType, inferProcedureOutput } from "@trpc/server";
import { useToast } from "../../../../src/providers/Toast";
import { extractError } from "../../../../src/utils/helper";
import { Area, Device } from "../../../../src/utils/types";
import { DeviceStatus } from "@app/commons";

const areaWidth = Dimensions.get("window").width;
const areaHeight = Dimensions.get("window").height / 1.8;

// const areaWidth = 400;
// const areaHeight = 400;

const useStyles = makeStyles((theme) => ({
  container: {
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 20,
    flex: 1,
  },
  input: {
    borderColor: theme.colors.primary,
  },
  select: {
    height: mapBreakpoint([50, 50, 60]),
    width: "100%",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  item: {
    padding: 20,
    fontSize: 80,
  },
  button: {
    backgroundColor: "white",
    width: 50,
    height: 50,
    borderRadius: 9999,
    display: "flex",
    justifyContent: "center",
  },
  buttonMapPosition: {
    position: "absolute",
    top: areaHeight - 80,
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 20,
  },
}));

type Lot = {
  device: number | undefined;
  id: number;
  areaId: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  createdAt: Date;
  updatedAt: Date;
};

export default function Index() {
  const styles = useStyles();

  const _area = trpc.parking.getArea.useQuery();
  const _devices = trpc.device.getDevices.useQuery();

  const allDevices = (_devices?.data ?? []) as Device[];
  const area = _area?.data as unknown as Area;

  if (!area) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
        }}
      >
        <Text>No parking space found</Text>
      </View>
    );
  }

  const height = Dimensions.get("window").height;

  return (
    <SafeAreaView
      style={{
        display: "flex",
        height: height - 70 - 60,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={{
          position: "relative",
          top: 0,
          height: areaHeight,
          width: areaWidth,
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
      >
        {area &&
          (area?.lots || []).map((lot, i) => (
            <Lot
              key={lot.id}
              lot={lot as unknown as Lot}
              index={i}
              area={area}
              device={allDevices.find((v) => v.id === lot.device)}
            />
          ))}
      </View>
      <View
        style={[
          styles.buttonMapPosition,
          {
            justifyContent: "flex-start",
          },
        ]}
      ></View>
    </SafeAreaView>
  );
}

interface LotProps {
  lot: Lot;
  index: number;
  area: Area;
  device?: Device;
}

const Lot = ({ index, lot, area, device }: LotProps) => {
    const {theme} = useTheme()
  const areaWidthRatio = areaWidth / area.width!;
  const areaHeightRatio = areaHeight / area.height!;
  const _devices = trpc.device.status.useQuery(
    { deviceID: lot.device },
    {
      enabled: !!lot.device,
      refetchInterval: 1000,
    }
  );

  const { status } = _devices.data || {};

  return (
    <Fragment>
      <View
        style={[
          {
            position: "absolute",
            top: lot.startY * areaHeightRatio,
            left: lot.startX * areaWidthRatio,
            width: (lot.endX - lot.startX) * areaWidthRatio,
            height: (lot.endY - lot.startY) * areaHeightRatio,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: "white",
            backgroundColor: "rgba(255,255,255,0.25)",
            zIndex: 100,
          },
          {
            ...(status === DeviceStatus.OCCUPIED && {
              backgroundColor: 'rgba(82, 196, 26, 0.25)',
            }),
          },
        ]}
      >
        <View
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 10 }}>{`Lot ${
            index + 1
          }`}</Text>
          {device && (
            <Text style={{ color: "white", fontSize: 10 }}>
              {device?.deviceID}
            </Text>
          )}
        </View>
      </View>
    </Fragment>
  );
};