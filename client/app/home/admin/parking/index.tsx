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
import { Device } from "../../../../src/utils/types";

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
  device?: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  id?: number | undefined;
  key: number;
  deleted?: boolean;
};

type Area = {
  id?: number | undefined;
  name?: string | undefined;
  height?: number | undefined;
  width?: number | undefined;
};

export default function Index() {
  const { toast } = useToast();
  const { theme } = useTheme();
  const styles = useStyles();
  const [selected, setSelected] = useState<Lot | undefined>(undefined);
  const [loading, toggleLoading] = useState(false);
  const [lots, setLots] = useState<Lot[]>([]);
  const [area, setArea] = useState<Partial<Area>>({
    height: 350,
    width: 350,
    name: "Area",
  });

  const ctx = trpc.useContext();
  const _area = trpc.parking.getArea.useQuery();
  const upsertArea = trpc.parking.upsertArea.useMutation();
  const _devices = trpc.device.getDevices.useQuery();

  useEffect(() => {
    const area = _area.data;

    if (area) {
      setArea({
        id: area.id,
        name: area.name,
        height: area.height,
        width: area.width,
      });

      setLots(
        (area.lots ?? []).map((v) => ({
          device: v.device,
          startX: v.startX,
          startY: v.startY,
          endX: v.endX,
          endY: v.endY,
          id: v.id,
          key: v.id!,
          deleted: false
        }))
      );
    }
  }, [!_area.isFetching, !_area.isStale])

  const allDevices = (_devices?.data ?? []) as Device[];
  const devices = allDevices.filter((v) => {
    const isSelected = lots.some((lot) => lot.device === v.id);
    return !isSelected;
  });

  const [dirty, toggleDirty] = useState(false);

  const handleAddLot = () => {
    toggleDirty(true);
    setLots((prev) => {
      const lastId = _.chain(prev).sortBy("id").last().value()?.id;

      const lastKey = _.chain(prev).sortBy("key").last().value()?.key;

      const key = (lastId ? lastId : lastKey || 0) + 1;

      return [
        ...prev,
        {
          startX: 0,
          startY: 0,
          endX: 45,
          endY: 85,
          key,
        },
      ];
    });
  };

  const handleSave = async () => {
    toggleLoading(true);

    if (!area.name || !area.height || !area.width) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await upsertArea.mutateAsync(
        {
          id: area.id,
          name: area.name,
          height: area.height,
          width: area.width,
          lots: lots.map((v) => ({
            device: v.device,
            startX: v.startX,
            startY: v.startY,
            endX: v.endX,
            endY: v.endY,
            id: v.id,
            deleted: v.deleted
          })),
        },
        {
          onError: (err) => {
            toast.error(extractError(err));
          },
          onSuccess: (data) => {
            toast.success("Area saved");
            ctx.parking.getArea.invalidate();
          },
        }
      );
    } catch (error) {}

    toggleDirty(false);
    toggleLoading(false);
  };

  return (
    <SafeAreaView
      style={{
        height: "100%",
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
        {lots.filter(v => !v.deleted).map((lot, i) => (
          <Draggable
            key={lot.key}
            lot={lot}
            index={i}
            area={area}
            updateLot={(partial) => {
              toggleDirty(true);
              setLots((prev) => {
                const newLots = [...prev];
                const index = newLots.findIndex((v) => v.key === lot.key);
                if (index > -1) {
                  newLots[index] = {
                    ...newLots[index],
                    ...partial,
                  };

                  return newLots;
                }
                return prev;
              });
            }}
            select={() => {
              setSelected(lot);
            }}
            selected={selected?.key === lot.key}
            devices={devices}
            device={allDevices.find((v) => v.id === lot.device)}
            deleteLot={() => {
              toggleDirty(true);
              setLots((prev) => {
                const newLots = [...prev];
                const index = newLots.findIndex((v) => v.key === lot.key);
                if (index > -1) {
                  newLots[index] = {
                    ...newLots[index],
                    deleted: true
                  };

                  return newLots;
                }
                return prev;
              });
            }}
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
      >
        <TouchableOpacity onPress={handleAddLot} style={styles.button}>
          <Icon name="plus-square" type="feather" size={30} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Button disabled={!dirty} title={"Save"} onPress={handleSave} />
      </ScrollView>
    </SafeAreaView>
  );
}

interface DraggableProps {
  lot: Lot;
  index: number;
  area: Partial<Area>;
  updateLot: (lot: Partial<Lot>) => void;
  selected?: boolean;
  select?: () => void;
  devices?: Device[];
  device?: Device;
  deleteLot: () => void;
}

type DragContext = {
  translateX: number;
  translateY: number;
  disabled: boolean;
};

const Draggable = ({
  index,
  lot,
  area,
  updateLot,
  selected,
  select,
  devices,
  device,
  deleteLot
}: DraggableProps) => {
  const styles = useStyles();
  const { theme } = useTheme();

  const [open, toggleOpen] = useState(false);
  const [isMove, toggleMove] = useState(false);
  const [dim, setDim] = useState({
    width: lot.endX - lot.startX,
    height: lot.endY - lot.startY,
  });
  const translateX = useSharedValue(lot.startX);
  const translateY = useSharedValue(lot.startY);

  const areaWidthRatio = areaWidth / area.width!;
  const areaHeightRatio = areaHeight / area.height!;

  useEffect(() => {
    if (!selected) {
      toggleMove(false);
    }
  }, [selected]);

  const panGestureEvent = useAnimatedGestureHandler({
    onStart: (event, context: DragContext) => {
      context.translateX = translateX.value;
      context.translateY = translateY.value;
    },
    onActive: (event, context) => {
      translateX.value = event.translationX + context.translateX;
      translateY.value = event.translationY + context.translateY;
    },
    onEnd: (event, context) => {
      const clamp = (value: number, min: number, max: number) => {
        return Math.min(Math.max(value, min), max);
      };

      const springConfig: WithSpringConfig = {
        damping: 60,
        velocity: 10,
        stiffness: 200,
        mass: 1,
      };

      const newX = clamp(
        translateX.value,
        0,
        areaWidth - dim.width * areaWidthRatio
      );

      const newY = clamp(
        translateY.value,
        0,
        areaHeight - dim.height * areaHeightRatio
      );

      translateX.value = withSpring(newX, springConfig);
      translateY.value = withSpring(newY, springConfig);
    },
    onFinish: () => {
      runOnJS(updateLot)({
        startX: translateX.value / areaWidthRatio,
        startY: translateY.value / areaHeightRatio,
        endX: translateX.value / areaWidthRatio + dim.width,
        endY: translateY.value / areaHeightRatio + dim.height,
      });
    },
  });

  const rStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: translateX.value,
        },
        {
          translateY: translateY.value,
        },
      ],
    };
  });

  return (
    <Fragment>
      <Dialog
        isVisible={open}
        onBackdropPress={() => toggleOpen(false)}
        overlayStyle={{ padding: 0, borderRadius: 8 }}
      >
        <TouchableOpacity
          style={styles.item}
          onPress={() => {
            toggleOpen(false);
            updateLot({
              device: undefined,
            });
          }}
        >
          <Text style={{ fontSize: 20 }}>None</Text>
        </TouchableOpacity>
        {(devices ?? []).map((v) => (
          <TouchableOpacity
            style={styles.item}
            key={v.deviceID}
            onPress={() => {
              toggleOpen(false);
              updateLot({
                device: v.id,
              });
            }}
          >
            <Text style={{ fontSize: 20 }}>{v.name}</Text>
          </TouchableOpacity>
        ))}
      </Dialog>
      <PanGestureHandler onGestureEvent={panGestureEvent}>
        <Animated.View
          style={[
            {
              position: "absolute",
              width: (lot.endX - lot.startX) * areaWidthRatio,
              height: (lot.endY - lot.startY) * areaHeightRatio,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: "white",
              backgroundColor: "rgba(255,255,255,0.25)",
              zIndex: 100,
              ...(selected && {
                borderColor: theme.colors.primary,
                backgroundColor: "rgba(32, 137, 220, 0.25)",
              }),
            },
            rStyle,
          ]}
        >
          <TouchableWithoutFeedback onPress={select}>
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
          </TouchableWithoutFeedback>
        </Animated.View>
      </PanGestureHandler>
      {selected && (
        <View
          style={[
            styles.buttonMapPosition,
            {
              right: 0,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              toggleOpen(true);
            }}
          >
            <Icon name="motion-sensor" type="material-community" size={30} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setDim((prev) => ({
                width: prev.height,
                height: prev.width,
              }));

              updateLot({
                endX: lot.startX + dim.height,
                endY: lot.startY + dim.width,
              });
            }}
          >
            <Icon name="rotate-right" type="fontawesome" size={30} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: theme.colors.error,
              }
            ]}
            onPress={() => {
              deleteLot()
            }}
          >
            <Icon name="delete-outline" type="material-community" size={30} color='white' />
          </TouchableOpacity>
        </View>
      )}
    </Fragment>
  );
};
