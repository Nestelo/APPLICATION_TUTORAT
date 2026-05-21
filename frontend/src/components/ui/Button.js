import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  ...props
}) => {
  const getBackgroundColor = () => {
    if (disabled) return '#ccc';
    switch (variant) {
      case 'primary':
        return '#007bff';
      case 'secondary':
        return '#6c757d';
      case 'outline':
        return 'transparent';
      case 'danger':
        return '#dc3545';
      case 'success':
        return '#28a745';
      default:
        return '#007bff';
    }
  };

  const getTextColor = () => {
    if (disabled) return '#666';
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
      case 'success':
        return '#fff';
      case 'outline':
        return '#007bff';
      default:
        return '#fff';
    }
  };

  const getBorderColor = () => {
    if (disabled) return '#ccc';
    switch (variant) {
      case 'outline':
        return '#007bff';
      default:
        return 'transparent';
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 6, paddingHorizontal: 12 };
      case 'medium':
        return { paddingVertical: 10, paddingHorizontal: 20 };
      case 'large':
        return { paddingVertical: 14, paddingHorizontal: 28 };
      default:
        return { paddingVertical: 10, paddingHorizontal: 20 };
    }
  };

  const renderIcon = () => {
    if (!icon) return null;
    // Si l'icône est déjà un élément JSX (comme <Ionicons name="send-outline" />)
    if (React.isValidElement(icon)) {
      return icon;
    }
    // Si c'est une chaîne de caractères (nom de l'icône)
    return (
      <Ionicons
        name={icon}
        size={size === 'small' ? 16 : size === 'medium' ? 20 : 24}
        color={getTextColor()}
        style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}
      />
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        getPadding(),
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1 : 0,
        },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && renderIcon()}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && renderIcon()}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Button;