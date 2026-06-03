import { Tabs } from "expo-router";
import {
  Car,
  ChartColumn,
  CirclePlus,
  CircleUser,
  ReceiptText,
} from "lucide-react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#16d26b",
        tabBarInactiveTintColor: "#87a4b0",
        tabBarStyle: {
          backgroundColor: "#08131b",
          borderTopColor: "#173344",
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "800",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <ChartColumn color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="registro"
        options={{
          title: "Registro",
          tabBarIcon: ({ color, size }) => (
            <CirclePlus color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="historial"
        options={{
          title: "Historial",
          tabBarIcon: ({ color, size }) => (
            <ReceiptText color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="vehiculos"
        options={{
          title: "Vehiculos",
          tabBarIcon: ({ color, size }) => <Car color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <CircleUser color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
