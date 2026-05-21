import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";

const LoadingSpinner = ({ size = "large", color = "#0b3d6d", text = "Chargement..." }) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size={size} color={color} />
        {text ? <Text style={styles.text}>{text}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  spinnerContainer: {
    justifyContent: "center",
    alignItems: "center",
  },

  text: {
    marginTop: 12,
    fontSize: 16,
    color: "#555",
    textAlign: "center",
  },
});

export default LoadingSpinner;