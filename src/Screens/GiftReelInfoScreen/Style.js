import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#222',
    textAlign: 'center',
  },
  paragraph: {
    fontSize: 16,
    color: '#444',
    marginBottom: 20,
    lineHeight: 24,
    textAlign: 'center',
  },
  bold: {
    fontWeight: 'bold',
    color: '#000',
  },
  button: {
    backgroundColor: '#1e90ff',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginTop: 20,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 15,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#1e90ff',
  },
});
