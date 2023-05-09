import { Dialog, Text, makeStyles, useTheme } from "@rneui/themed";
import { BarCodeScanner, BarCodeScannedCallback } from "expo-barcode-scanner";
import React, { useEffect, useState } from "react";
import { View, Dimensions } from "react-native";
import { trpc } from "../../../../src/utils/trpc";
import { useToast } from "../../../../src/providers/Toast";
import { extractError } from "../../../../src/utils/helper";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import { User } from "../../../../src/utils/types";
import { UserType } from "@app/commons";

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

  const [open, toggle] = useState(false);
  const [loading, toggleLoading] = useState(false);
  const [selected, setSelected] = useState<User>();
  const utils = trpc.useContext();
  const users = trpc.user.users.useQuery();
  const approve = trpc.user.approve.useMutation();

  const sorted = users.data
    ?.sort((a, b) => {
      if (a.approved && !b.approved) return 1;
      if (!a.approved && b.approved) return -1;
      return 0;
    })
    .filter((v) => v.type !== UserType.ADMIN);

  const handleApprove = async () => {
    toggleLoading(true);

    if (!selected) {
      toast.error("No user selected");
      toggleLoading(false);
      return;
    }

    try {
      await approve.mutateAsync(selected.id, {
        onError: (error) => {
          toast.error(extractError(error));
        },
        onSuccess: () => {
          toast.success("Approved");
          utils.user.users.invalidate();
          toggle(false);
        },
      });
    } catch (error) {
      toast.error((error as Error).message);
    }
    toggleLoading(false);
  };

  const { theme } = useTheme();

  return (
    <>
      <Dialog isVisible={open} onBackdropPress={() => toggle(false)}>
        <Dialog.Title title="Approve" />
        <Text>
          {`Approve `}
          <Text style={{ fontWeight: "800" }}>{selected?.name}</Text>
          <Text>{` from ${selected?.college}`}</Text>
        </Text>
        <Dialog.Actions>
          <Dialog.Button title="Approve" onPress={handleApprove} />
          <Dialog.Button title="Cancel" onPress={() => toggle(false)} />
        </Dialog.Actions>
      </Dialog>
      <ScrollView style={styles.container}>
        {sorted?.map((user, i) => (
          <TouchableOpacity
            key={user.id}
            onPress={() => {
              if (user.approved) return;
              toggle(true);
              setSelected(user as unknown as User);
            }}
            style={{
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
            <View
              style={{
                padding: 10,
                backgroundColor: user.approved
                  ? theme.colors.success
                  : "transparent",
              }}
            >
              <Text style={{ color: "black", zIndex: 100 }}>{user.name}</Text>
              <Text style={{ color: "black" }}>{user.college}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );
}
