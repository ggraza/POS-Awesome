<template>
  <v-dialog v-model="isVisible" max-width="500">
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>
        <p>{{ message }}</p>
        <!-- Hidden RFID Input -->
        <v-text-field
          v-model="rfidInput"
          label="Scan RFID"
          type="text"
          class="hidden-text-field"
          autofocus
          @keydown.enter="validateAndScan"
        ></v-text-field>
        <!-- Error Message -->
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" @click="validateAndScan">Submit</v-btn>
        <v-btn text @click="closePopup">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data() {
    return {
      isVisible: false,
      title: "",
      message: "",
      rfidInput: "",
      onScanCallback: null,
      errorMessage: "", // For displaying errors
    };
  },
  methods: {
    openPopup({ title, message, onScan }) {
      this.title = title;
      this.message = message;
      this.onScanCallback = onScan;
      this.rfidInput = ""; // Clear the input on opening
      this.errorMessage = ""; // Reset error message
      this.isVisible = true;
    },
    closePopup() {
      this.isVisible = false;
      this.rfidInput = "";
      this.errorMessage = "";
      this.$root.$emit("escEventTriggered");
    },
    validateAndScan() {
      // Trim the input to avoid issues with extra whitespace
      const scannedRFID = this.rfidInput.trim();

      if (!scannedRFID) {
        // Show error if RFID is empty
        this.errorMessage = "No RFID scanned. Please try again.";
        return;
      }

      // Verify the scanned RFID (optional additional logic can go here)
      if (scannedRFID.length < 5) {
        this.errorMessage = "Invalid RFID. Please scan again.";
        return;
      }

      // Pass the valid RFID to the callback
      if (this.onScanCallback) {
        this.onScanCallback(scannedRFID); // Pass RFID value to callback
      }

      this.closePopup(); // Close the popup after successful scan
    },
  },
};
</script>

<style scoped>
.hidden-text-field {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none; /* Completely hide and disable manual interaction */
}
.error-text {
  color: red;
  font-size: 14px;
  margin-top: 10px;
}
</style>
