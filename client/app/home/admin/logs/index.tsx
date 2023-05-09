import { Icon, Text, useTheme } from "@rneui/themed";
import { trpc } from "../../../../src/utils/trpc";
import { View, Dimensions } from "react-native";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import { useState } from "react";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { mapBreakpoint } from "../../../../src/utils/responsive";
import moment from "moment";
import { BarChart, PieChart } from "react-native-chart-kit";
import { LogAction, LogType } from "@app/commons";

export default function Index() {
  const { theme } = useTheme();
  const [open, toggleOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const _logs = trpc.user.getLogs.useQuery(moment(date).unix());
  const _approval = trpc.user.approvalStats.useQuery();
  const _colleges = trpc.user.colleges.useQuery();


  const logs = _logs.data ?? [];

  const dimHeight = Dimensions.get("window").height;
  const approval = _approval.data;
  const keys = Object.keys(_colleges.data ?? {})
  
  const collegesNoColors = keys.map((key, i) => ({
    value: _colleges.data?.[key].length ?? 0,
    label: key === 'null' ? "Unknown" : key,
  }));

  const colleges = collegesNoColors.map((college, i) => ({
    ...college,
    color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
  }))

  const offset = 2;

  // time ranges
  const ranges = new Array(24 / offset)
    .fill(0)
    .map((_, i) => i * offset)
    .map((hour) => {
      return {
        start: hour,
        end: hour + offset,
        label: `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}${
          hour < 12 ? "am" : "pm"
        }`,
      };
    });

  const values = ranges.map((range) => {
    const logs = _logs.data?.filter((log) => {
      const hour = moment(log.createdAt).hour();
      return (
        hour >= range.start && hour < range.end && log.type === LogType.USER
      );
    });

    return {
      label: range.label,
      value: logs?.length ?? 0,
    };
  });

  const valuesVacancy = ranges.map((range) => {
    const logs = _logs.data?.filter((log) => {
      const hour = moment(log.createdAt).hour();
      return (
        hour >= range.start &&
        hour < range.end &&
        log.type === LogType.DEVICE &&
        log.action === LogAction.VACANT
      );
    });

    return {
      label: range.label,
      value: logs?.length ?? 0,
    };
  });

  return (
    <>
      <ScrollView>
        <View
          style={{
            height: dimHeight + 600,
            padding: 20,
          }}
        >
          <View
            style={{
              borderWidth: 1,
              borderRadius: 8,
              borderColor: theme.colors.primary,
              height: mapBreakpoint([45, 45, 60]),
              zIndex: 100,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                DateTimePickerAndroid.open({
                  onChange: (e, date) => {
                    if (date) {
                      setDate(date);
                    }
                  },
                  value: date,
                });
              }}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
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
                    color: theme.colors.grey3,
                  }}
                >
                  {date.toISOString().slice(0, 10)}
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
          <View style={{ height: 400 }}>
            <Text style={{ marginTop: 20, fontWeight: "800" }}>Entry Logs</Text>
            <View
              style={{ marginTop: 0, left: -50, height: 200, maxHeight: 200 }}
            >
              <BarChart
                data={{
                  datasets: [
                    {
                      data: values.map((v) => v.value),
                    },
                  ],
                  labels: values.map((v) => v.label),
                }}
                width={Dimensions.get("window").width + 40}
                yAxisLabel=""
                yAxisSuffix=""
                height={200}
                showBarTops={false}
                style={{
                  maxHeight: 200,
                  minHeight: 200,
                }}
                chartConfig={{
                  color: () => theme.colors.primary,
                  labelColor: () => theme.colors.grey3,
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  fillShadowGradientFromOpacity: 1,
                  fillShadowGradientToOpacity: 0,
                  decimalPlaces: 0, // optional, defaults to 2dp
                  barRadius: 6,
                  barPercentage: 0.25,
                  style: {
                    width: 15,
                  },
                  formatYLabel: (value) => "",
                  propsForLabels: {
                    fontSize: 8,
                    dy: -10,
                  },
                  propsForDots: {
                    r: "6",
                    strokeWidth: 2,
                    stroke: "#ffa726",
                  },
                  propsForBackgroundLines: {
                    style: {
                      opacity: 0.25,
                    },
                  },
                }}
              />
            </View>
            <Text style={{ marginTop: 10, fontWeight: "800" }}>
              Vacancy Logs
            </Text>
            <View
              style={{ marginTop: 0, left: -50, height: 200, maxHeight: 200 }}
            >
              <BarChart
                data={{
                  datasets: [
                    {
                      data: valuesVacancy.map((v) => v.value),
                    },
                  ],
                  labels: valuesVacancy.map((v) => v.label),
                }}
                width={Dimensions.get("window").width + 40}
                yAxisLabel=""
                yAxisSuffix=""
                height={200}
                showBarTops={false}
                style={{
                  maxHeight: 200,
                  minHeight: 200,
                }}
                chartConfig={{
                  color: () => theme.colors.primary,
                  labelColor: () => theme.colors.grey3,
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  fillShadowGradientFromOpacity: 1,
                  fillShadowGradientToOpacity: 0,
                  decimalPlaces: 0, // optional, defaults to 2dp
                  barRadius: 6,
                  barPercentage: 0.25,
                  style: {
                    width: 15,
                  },
                  formatYLabel: (value) => "",
                  propsForLabels: {
                    fontSize: 8,
                    dy: -10,
                  },
                  propsForDots: {
                    r: "6",
                    strokeWidth: 2,
                    stroke: "#ffa726",
                  },
                  propsForBackgroundLines: {
                    style: {
                      opacity: 0.25,
                    },
                  },
                }}
              />
            </View>
            <Text style={{ marginTop: 10, fontWeight: "800" }}>Approval (Global)</Text>

            <View
              style={{
                display: "flex",
                flexDirection: "row",
                marginTop: 0,
                width: "100%",
                alignItems: "center",
                height: 200,
                maxHeight: 200,
                gap: 30,
              }}
            >
              <View>
                <PieChart
                  data={[
                    {
                      name: "Approved",
                      population: approval?.approved || 0,
                      color: theme.colors.primary,
                    },
                    {
                      name: "Unapproved",
                      population: approval?.pending || 0,
                      color: theme.colors.grey3,
                    },
                  ]}
                  width={Dimensions.get("window").width / 2}
                  height={150}
                  chartConfig={{
                    color: () => theme.colors.primary,
                    labelColor: () => theme.colors.grey3,
                    backgroundColor: "transparent",
                  }}
                  style={{
                    left: 35,
                  }}
                  accessor={"population"}
                  backgroundColor={"transparent"}
                  paddingLeft={"15"}
                  hasLegend={false}
                />
              </View>
              <View
                style={{
                  width: 300,
                  left: -20,
                  display: "flex",
                  gap: 20,
                }}
              >
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      backgroundColor: theme.colors.primary,
                      borderRadius: 8,
                    }}
                  />
                  <Text style={{ color: theme.colors.grey3, fontSize: 12 }}>
                    {approval?.approved || 0} Approved
                  </Text>
                </View>
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      backgroundColor: theme.colors.grey3,
                      borderRadius: 8,
                    }}
                  />
                  <Text style={{ color: theme.colors.grey3, fontSize: 12 }}>
                    {approval?.pending || 0} Unapproved
                  </Text>
                </View>
              </View>
            </View>

            <Text style={{ marginTop: 10, fontWeight: "800" }}>
              Colleges (Global)
            </Text>

            <View
              style={{
                display: "flex",
                flexDirection: "row",
                marginTop: 0,
                width: "100%",
                alignItems: "center",
                height: 200,
                maxHeight: 200,
                gap: 30,
              }}
            >
              <View>
                <PieChart
                  data={colleges.map((college) => ({
                    name: college.label || 'Unknown',
                    population: college.value,
                    color: college.color,
                  }))}
                  width={Dimensions.get("window").width / 2}
                  height={150}
                  chartConfig={{
                    color: () => theme.colors.primary,
                    labelColor: () => theme.colors.grey3,
                    backgroundColor: "transparent",
                  }}
                  style={{
                    left: 35,
                  }}
                  accessor={"population"}
                  backgroundColor={"transparent"}
                  paddingLeft={"15"}
                  hasLegend={false}
                />
              </View>
              <View
                style={{
                  width: 300,
                  left: -20,
                  display: "flex",
                  gap: 20,
                }}
              >
                {colleges.map((college) => {
                  return (
                    <View
                      key={college.label}
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          backgroundColor: college.color,
                          borderRadius: 8,
                        }}
                      />
                      <Text style={{ color: theme.colors.grey3, fontSize: 12 }}>
                        {college.value || 0} {college.label ?? 'Unknown'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
