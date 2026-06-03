import { Image, StyleSheet, Text, View } from "react-native";

const logoSource = require("@/assets/images/appgas-logo-512.png");

export function BrandMark() {
  return (
    <View style={styles.brand}>
      <Image source={logoSource} style={styles.logo} />
      <Text style={styles.name}>appGas</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  name: {
    color: "#7bf1ad",
    fontSize: 15,
    fontWeight: "900",
  },
});
