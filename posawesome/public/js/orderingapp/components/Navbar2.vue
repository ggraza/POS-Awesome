<template>
  <nav>
    <v-app-bar app height="40" class="elevation-2">
      <v-app-bar-nav-icon
        @click.stop="drawer = !drawer"
        class="grey--text"
      ></v-app-bar-nav-icon>
      <v-img
        src="/assets/posawesome/js/rmsapp/components/pos/pos.png"
        alt="POS Awesome"
        max-width="32"
        class="mr-2"
        color="primary"
      ></v-img>
      <v-toolbar-title
        @click="go_desk"
        style="cursor: pointer"
        class="text-uppercase primary--text"
      >
        <span class="font-weight-light">pos</span>
        <span>G2Virtu</span>
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <!-- POS Expense Button with Tooltip -->
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon color="error" v-bind="attrs" v-on="on" @click="openExpense">
            <v-icon>mdi-cash-minus</v-icon>
          </v-btn>
        </template>
        <span>Create POS Expense</span>
      </v-tooltip>

      <!-- Calculator Button with Tooltip -->
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon color="warning" v-bind="attrs" v-on="on" @click="openCalculator">
            <v-icon>mdi-calculator</v-icon>
          </v-btn>
        </template>
        <span>Open Calculator</span>
      </v-tooltip>

      <!-- Full Calculator Dialog -->
      <v-dialog v-model="calculatorVisible" persistent max-width="350">
        <v-card>
          <v-card-title class="text-h5">Calculator</v-card-title>
          <v-card-text>
            <!-- Calculator Display -->
            <v-text-field
              v-model="calculatorDisplay"
              label="Result"
              outlined
              class="text-right"
              @input="handleInput"
              @keydown.enter="calculateResult"
              @keydown="handleKeyDown"
            ></v-text-field>

            <!-- Calculator Buttons with 4 per row -->
            <v-row>
              <v-col cols="3"><v-btn @click="clearAll" class="calc-btn" color="red">AC</v-btn></v-col>
              <v-col cols="3"><v-btn @click="clearEntry" class="calc-btn" color="orange">CE</v-btn></v-col>
              <v-col cols="3"><v-btn @click="appendOperator('%')" class="calc-btn">%</v-btn></v-col>
              <v-col cols="3"><v-btn @click="appendOperator('/')" class="calc-btn">/</v-btn></v-col>
              
              <v-col cols="3"><v-btn @click="appendValue('7')" class="calc-btn">7</v-btn></v-col>
              <v-col cols="3"><v-btn @click="appendValue('8')" class="calc-btn">8</v-btn></v-col>
              <v-col cols="3"><v-btn @click="appendValue('9')" class="calc-btn">9</v-btn></v-col>
              <v-col cols="3"><v-btn @click="appendOperator('*')" class="calc-btn">*</v-btn></v-col>

              <v-col cols="3"><v-btn @click="appendValue('4')" class="calc-btn">4</v-btn></v-col>
              <v-col cols="3"><v-btn @click="appendValue('5')" class="calc-btn">5</v-btn></v-col>
              <v-col cols="3"><v-btn @click="appendValue('6')" class="calc-btn">6</v-btn></v-col>
              <v-col cols="3"><v-btn @click="appendOperator('-')" class="calc-btn">-</v-btn></v-col>

              <v-col cols="3"><v-btn @click="appendValue('1')" class="calc-btn">1</v-btn></v-col>
              <v-col cols="3"><v-btn @click="appendValue('2')" class="calc-btn">2</v-btn></v-col>
              <v-col cols="3"><v-btn @click="appendValue('3')" class="calc-btn">3</v-btn></v-col>
              <v-col cols="3"><v-btn @click="appendOperator('+')" class="calc-btn">+</v-btn></v-col>

              <v-col cols="6"><v-btn @click="appendValue('0')" class="calc-btn calc-zero">0</v-btn></v-col>
              <v-col cols="3"><v-btn @click="appendValue('.')" class="calc-btn">.</v-btn></v-col>
              <v-col cols="3"><v-btn @click="calculateResult" class="calc-btn" color="green">=</v-btn></v-col>
            </v-row>
          </v-card-text>

          <v-card-actions>
            <v-btn color="error" @click="closeCalculator">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <!-- Calculator Buttons -->
      <!-- Fullscreen Button with Tooltip -->
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon color="accent" v-bind="attrs" v-on="on" @click="toggleFullscreen">
            <v-icon v-if="!isFullscreen">mdi-fullscreen</v-icon>
            <v-icon v-else>mdi-fullscreen-exit</v-icon>
          </v-btn>
        </template>
        <span v-if="!isFullscreen">Enter Fullscreen</span>
        <span v-else>Exit Fullscreen</span>
      </v-tooltip>
      <!-- Added button for Shortcuts Info -->
      <v-btn color="error" text @click="openShortcutsDialog">
        Shortcuts
      </v-btn>

      <div class="profile-section mx-1">
        <v-chip color="primary" variant="outlined" class="profile-chip">
          <v-icon start>mdi-account-circle</v-icon>
          {{ pos_profile.name }}
        </v-chip>
      </div>

      <div class="text-center">
        <v-menu offset-y :min-width="240" :close-on-content-click="false" location="bottom end" :offset="[0, 4]">
          <template v-slot:activator="{ on, attrs }">
            <v-btn color="primary" v-bind="attrs" v-on="on" variant="elevated" class="menu-btn-compact"
              >Menu</v-btn
            >
          </template>
          <v-card class="mx-auto" max-width="300" tile>
            <v-list dense>
              <v-list-item-group v-model="menu_item" color="primary">
                <v-list-item
                  @click="close_shift_dialog"
                  v-if="!pos_profile.posa_hide_closing_shift && item == 0"
                >
                  <v-list-item-icon>
                    <v-icon>mdi-content-save-move-outline</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>{{
                      __('Close Shift')
                    }}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
                <v-list-item
                  @click="print_last_invoice"
                  v-if="
                    pos_profile.posa_allow_print_last_invoice &&
                    this.last_invoice
                  "
                >
                  <v-list-item-icon>
                    <v-icon>mdi-printer</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>{{
                      __('Print Last Invoice')
                    }}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
                <v-divider class="my-0"></v-divider>
                <v-list-item @click="logOut">
                  <v-list-item-icon>
                    <v-icon>mdi-logout</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>{{ __('Logout') }}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
                <v-list-item @click="go_about">
                  <v-list-item-icon>
                    <v-icon>mdi-information-outline</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>{{ __('About') }}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-card>
        </v-menu>
      </div>
    </v-app-bar>

    <!-- Dialog to display shortcuts -->
<v-dialog v-model="shortcutsDialog" max-width="600">
  <v-card>
    <v-card-title class="text-h5">Keyboard Shortcuts</v-card-title>
    <v-card-text>
      <!-- Table for keyboard shortcuts -->
      <v-simple-table>
        <thead>
          <tr>
            <th class="text-left">Shortcut</th>
            <th class="text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>ALT + F or ESC</strong></td>
            <td>Focus on search field</td>
          </tr>
          <tr>
            <td><strong>ALT + C</strong></td>
            <td>Focus on Customer Field</td>
          </tr>
          <tr>
            <td><strong>CTRL or CMD + S or F7</strong></td>
            <td>Open payments</td>
          </tr>
          <tr>
            <td><strong>F8</strong></td>
            <td>Submit & Print after open payments</td>
          </tr>
          <tr>
            <td><strong>CTRL or CMD + X</strong></td>
            <td>Submit payments</td>
          </tr>
          <tr>
            <td><strong>CTRL or CMD + D</strong></td>
            <td>Remove first item from the top</td>
          </tr>
          <tr>
            <td><strong>CTRL or CMD + Q or F6</strong></td>
            <td>Expand first item from the top</td>
          </tr>
          <tr>
            <td><strong>CTRL or CMD + +</strong></td>
            <td>Increase Qty</td>
          </tr>
          <tr>
            <td><strong>CTRL or CMD + -</strong></td>
            <td>Decrease Qty</td>
          </tr>
          <tr>
            <td><strong>CTRL or CMD + Z</strong></td>
            <td>Focus on discount field</td>
          </tr>
          <tr>
            <td><strong>CTRL or CMD + B or F9</strong></td>
            <td>Hold Invoice</td>
          </tr>
          <tr>
            <td><strong>ALT + B or F10</strong></td>
            <td>Retrieve Invoice</td>
          </tr>
          <tr>
            <td><strong>ALT + R or F11</strong></td>
            <td>Return Invoice</td>
          </tr>
          <tr>
            <td><strong>ALT + V</strong></td>
            <td>Cancel Current Invoice</td>
          </tr>
          <tr>
            <td><strong>CTRL or CMD + H</strong></td>
            <td>On hold invoice, focus on Search Field</td>
          </tr>
        </tbody>
      </v-simple-table>
    </v-card-text>
    <v-card-actions>
      <v-btn color="primary" @click="shortcutsDialog = false">Close</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

    <v-navigation-drawer
      v-model="drawer"
      :mini-variant.sync="mini"
      app
      class="primary margen-top"
      width="170"
    >
      <v-list dark>
        <v-list-item class="px-2">
          <v-list-item-avatar>
            <v-img :src="company_img"></v-img>
          </v-list-item-avatar>

          <v-list-item-title>{{ company }}</v-list-item-title>

          <v-btn icon @click.stop="mini = !mini">
            <v-icon>mdi-chevron-left</v-icon>
          </v-btn>
        </v-list-item>

        <v-list-item-group v-model="item" color="white">
          <v-list-item
            v-for="item in items"
            :key="item.text"
            @click="changePage(item.text)"
          >
            <v-list-item-icon>
              <v-icon v-text="item.icon"></v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title v-text="item.text"></v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>

    <v-snackbar v-model="snack" :timeout="5000" :color="snackColor" top right>
      {{ snackText }}
    </v-snackbar>


    <v-dialog v-model="freeze" persistent max-width="290">
      <v-card>
        <v-card-title class="text-h5">
          {{ freezeTitle }}
        </v-card-title>
        <v-card-text>{{ freezeMsg }}</v-card-text>
      </v-card>
    </v-dialog>
  </nav>
</template>

<script>
import { evntBus } from '../bus';

export default {
  data() {
    return {
      drawer: false,
      mini: true,
      item: 0,
      items: [{ text: 'POS', icon: 'mdi-network-pos' }],
      page: '',
      fav: true,
      menu: false,
      message: false,
      hints: true,
      menu_item: 0,
      snack: false,
      snackColor: '',
      snackText: '',
      company: 'POS Awesome',
      company_img: '/assets/erpnext/images/erpnext-logo.svg',
      pos_profile: '',
      freeze: false,
      freezeTitle: '',
      freezeMsg: '',
      last_invoice: '',
      shortcutsDialog: false, // Added for shortcuts dialog
      calculatorVisible: false, // Controls calculator dialog visibility
      calculatorDisplay: '', // Holds the current display value
      lastValue: '', // Stores the last entered value
      lastOperator: '', // Stores the last operator used
      isFullscreen: false
    };
  },
  methods: {
    toggleFullscreen() {
      if (!this.isFullscreen) {
        // Enter fullscreen
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) { // Firefox
          document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) { // Chrome, Safari, Opera
          document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) { // IE/Edge
          document.documentElement.msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { // Firefox
          document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { // Chrome, Safari, Opera
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { // IE/Edge
          document.msExitFullscreen();
        }
      }
    },
    openExpense() {
      evntBus.$emit("open_expense", "true");
    },
    // Toggle calculator dialog
    openCalculator() {
      this.calculatorVisible = true;
    },
    closeCalculator() {
      this.calculatorVisible = false;
    },
    clearAll() {
      // Clears all calculator data
      this.calculatorDisplay = '';
    },
    clearEntry() {
      // Clears the last entered value (similar to backspace)
      this.calculatorDisplay = this.calculatorDisplay.slice(0, -1);
    },
    appendValue(value) {
      // Adds the pressed number to the display (appends to the expression)
      this.calculatorDisplay += value;
    },
    appendOperator(operator) {
      // Adds the pressed operator to the display (appends to the expression)
      const lastChar = this.calculatorDisplay.slice(-1);
      if (this.calculatorDisplay !== '' && !['+', '-', '*', '/', '%'].includes(lastChar)) {
        this.calculatorDisplay += operator;
      }
    },
//    calculateResult() {
//      // Calculate the result from the full expression
//      try {
//        this.calculatorDisplay = eval(this.calculatorDisplay).toString();
//      } catch (e) {
//        this.calculatorDisplay = 'Error';
//      }
//    },
    calculateResult() {
      try {
        this.calculatorDisplay = Function(`"use strict"; return (${this.calculatorDisplay})`)().toString();
      } catch (error) {
        this.calculatorDisplay = "Error";
      }
    },
    handleInput() {
      // Allow typing valid numbers, operators, and decimals
      const lastChar = this.calculatorDisplay.slice(-1);
      const validInput = /^[0-9+\-*/.%]*$/;
      
      // Prevent consecutive operators from being typed
      if (!validInput.test(this.calculatorDisplay)) {
        this.calculatorDisplay = this.calculatorDisplay.slice(0, -1);
      }

      // Prevent multiple consecutive operators
      if (['+', '-', '*', '/', '%'].includes(lastChar) && ['+', '-', '*', '/', '%'].includes(this.calculatorDisplay.slice(-2, -1))) {
        this.calculatorDisplay = this.calculatorDisplay.slice(0, -1);
      }
    },
    handleKeyDown(event) {
      // Handle keyboard input for the + operator
      if (event.key === '+') {
        this.appendOperator('+');
        event.preventDefault(); // Prevent default behavior for + key
      }
    },
  openShortcutsDialog() {
    this.shortcutsDialog = true;
  },
    changePage(key) {
      this.$emit('changePage', key);
    },
    go_desk() {
      frappe.set_route('/');
      location.reload();
    },
    go_about() {
      const win = window.open(
        'https://www.g2virtu.com/2024/02/g2-rms.html',
        '_blank'
      );
      win.focus();
    },
    close_shift_dialog() {
      evntBus.$emit('open_closing_dialog');
    },
    show_mesage(data) {
      this.snack = true;
      this.snackColor = data.color;
      this.snackText = data.text;
    },
    logOut() {
      var me = this;
      me.logged_out = true;
      return frappe.call({
        method: 'logout',
        callback: function (r) {
          if (r.exc) {
            return;
          }
          frappe.set_route('/login');
          location.reload();
        },
      });
    },
    print_last_invoice() {
      if (!this.last_invoice) return;
      const print_format =
        this.pos_profile.print_format_for_online ||
        this.pos_profile.print_format;
      const letter_head = this.pos_profile.letter_head || 0;
      const url =
        frappe.urllib.get_base_url() +
        '/printview?doctype=Sales%20Invoice&name=' +
        this.last_invoice +
        '&trigger_print=1' +
        '&format=' +
        print_format +
        '&no_letterhead=' +
        letter_head;
      const printWindow = window.open(url, 'Print');
      printWindow.addEventListener(
        'load',
        function () {
          printWindow.print();
        },
        true
      );
    },
  },
  mounted() {
    // Update the fullscreen state based on fullscreen change events
    document.addEventListener("fullscreenchange", () => {
      this.isFullscreen = !!document.fullscreenElement;
    });
    document.addEventListener("webkitfullscreenchange", () => {
      this.isFullscreen = !!document.webkitFullscreenElement;
    });
    document.addEventListener("mozfullscreenchange", () => {
      this.isFullscreen = !!document.mozFullScreenElement;
    });
    document.addEventListener("msfullscreenchange", () => {
      this.isFullscreen = !!document.msFullscreenElement;
    });
  },
  created: function () {
    this.$nextTick(function () {
      evntBus.$on('show_mesage', (data) => {
        this.show_mesage(data);
      });
      evntBus.$on('set_company', (data) => {
        this.company = data.name;
        this.company_img = data.company_logo
          ? data.company_logo
          : this.company_img;
      });
      evntBus.$on('register_pos_profile', (data) => {
        this.pos_profile = data.pos_profile;
        const payments = { text: 'Payments', icon: 'mdi-cash-register' };
        if (
          this.pos_profile.posa_use_pos_awesome_payments &&
          this.items.length !== 2
        ) {
          this.items.push(payments);
        }
      });
      evntBus.$on('set_last_invoice', (data) => {
        this.last_invoice = data;
      });
      evntBus.$on('freeze', (data) => {
        this.freeze = true;
        this.freezeTitle = data.title;
        this.freezeMsg = data.msg;
      });
      evntBus.$on('unfreeze', () => {
        this.freeze = false;
        this.freezTitle = '';
        this.freezeMsg = '';
      });
    });
  },
};
</script>

<style scoped>
/* Style for calculator buttons */
.calc-btn {
  min-width: 64px;
  min-height: 64px;
  font-size: 20px;
}

.calc-zero {
  width: 100%; /* Make the 0 button fill two columns */
}

.v-card {
  padding: 20px;
}

.margen-top {
  margin-top: 0px;
}
/* --- App Bar and Drawer Styling --- */
/* Styles related to the main application bar and the side navigation drawer. */

/* Adds a subtle bottom border to the app bar for visual separation. */
.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}

/* Sets a secondary text color, typically a lighter shade of black. */
.text-secondary {
  color: rgba(0, 0, 0, 0.6) !important;
}

/* Custom styling for the navigation drawer, including background and transition effects. */
.drawer-custom {
  background-color: #fafafa;
  transition: all 0.3s ease-out;
}

/* Styling for the header section of the expanded navigation drawer. */
.drawer-header {
  display: flex;
  align-items: center;
  height: 64px;
  padding: 0 16px;
}

/* Styling for the header section of the mini (collapsed) navigation drawer. */
.drawer-header-mini {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 64px;
}

/* Styling for the company name text within the drawer header. */
.drawer-company {
  margin-left: 12px;
  flex: 1;
  font-weight: 500;
  font-size: 1rem;
  color: #424242;
}

/* Styling for icons within the navigation drawer list items. */
.drawer-icon {
  font-size: 24px;
  color: #1976d2;
}

/* Styling for the title text of navigation drawer list items. */
.drawer-item-title {
  margin-left: 8px;
  font-weight: 500;
  color: #424242;
}

/* Hover effect for all list items in the navigation drawer. */
.v-list-item:hover {
  background-color: rgba(25, 118, 210, 0.1) !important;
}

/* Styling for the actively selected list item in the navigation drawer. */
.active-item {
  background-color: rgba(25, 118, 210, 0.2) !important;
}

/* --- User Menu Styling --- */
/* Styles specific to the user actions dropdown menu. */

/* Styling for the main "Menu" button that activates the dropdown. */
.user-menu-btn {
  text-transform: none;
  padding: 4px 12px;
  font-weight: 500;
}

/* Styling for the card that contains the dropdown menu list. */
.user-menu-card {
  border-radius: 8px;
  overflow: hidden;
}

/* Padding for the list within the user menu card. */
.user-menu-list {
  padding-top: 8px;
  padding-bottom: 8px;
}

/* Padding for individual list items within the user menu. */
.user-menu-item {
  padding: 10px 16px;
}

/* Minimum width for icons within user menu list items to ensure alignment. */
.user-menu-item .v-list-item-icon {
  min-width: 36px;
}

/* Margin for dividers within the user menu list. */
.user-menu-card .v-divider {
  margin: 8px 0;
}

/* --- Status Indicator Styling --- */
.status-btn {
  transition: all 0.3s ease;
}

.status-btn:hover {
  transform: scale(1.1);
}

.status-tooltip {
  padding: 4px 0;
  text-align: center;
}

.status-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.status-detail {
  font-size: 0.8rem;
  opacity: 0.9;
}

.status-warning {
  font-size: 0.8rem;
  color: #ff9800;
  margin-top: 4px;
}

/* --- Sync Info Styling --- */
.sync-chip {
  cursor: pointer;
  transition: all 0.3s ease;
}

.sync-chip:hover {
  transform: scale(1.05);
}

.sync-text {
  font-size: 0.75rem;
  white-space: nowrap;
}

/* Enhanced Navbar Styling */
.navbar-enhanced {
  background-image: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important;
  background-color: #ffffff !important;
  border-bottom: 2px solid #e3f2fd !important;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  padding-bottom: 4px !important;
  /* Reduced bottom padding */
}

.navbar-enhanced:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;
}

/* Logo and Brand Styling */
.navbar-title {
  text-decoration: none !important;
  border-bottom: none !important;
}

.navbar-title:hover {
  text-decoration: none !important;
}

.logo-container {
  margin: 0 8px;
  /* Reduced margin */
  padding: 2px;
  /* Reduced padding */
  border-radius: 8px;
  background: linear-gradient(135deg, #1976d2, #42a5f5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-img {
  filter: brightness(0) invert(1);
  transition: transform 0.3s ease;
}

.logo-container:hover .logo-img {
  transform: scale(1.1);
}

.brand-title {
  font-size: 1.5rem !important;
  font-weight: 700 !important;
  background: linear-gradient(135deg, #1976d2, #42a5f5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transition: all 0.3s ease;
  text-decoration: none !important;
}

.brand-title:hover {
  transform: scale(1.05);
  text-decoration: none !important;
}

.brand-pos {
  font-weight: 300;
}

.brand-awesome {
  font-weight: 800;
}

/* Navigation Icon */
.nav-icon {
  border-radius: 12px;
  padding: 6px;
  /* Reduced padding */
  transition: all 0.3s ease;
}

.nav-icon:hover {
  background-color: rgba(25, 118, 210, 0.1);
  transform: scale(1.1);
}

/* Profile Section */
.profile-section {
  margin: 0 8px;
  /* Reduced margin */
}

.profile-chip {
  font-weight: 500;
  padding: 6px 12px;
  /* Reduced padding */
  border-radius: 20px;
  transition: all 0.3s ease;
}

.profile-chip:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
}

/* Enhanced Status Section */
.status-section-enhanced {
  display: flex;
  align-items: center;
  gap: 8px;
  /* Reduced gap */
  margin-right: 8px;
  /* Reduced margin */
}

.status-btn-enhanced {
  background: rgba(25, 118, 210, 0.1) !important;
  border: 1px solid rgba(25, 118, 210, 0.3);
  transition: all 0.3s ease;
  padding: 4px;
  /* Reduced padding */
}

.status-btn-enhanced:hover {
  background: rgba(25, 118, 210, 0.2) !important;
  transform: scale(1.05);
}

.status-info-always-visible {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 120px;
}

.status-title-inline {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  transition: color 0.3s ease;
}

.status-title-inline.status-connected {
  color: #4caf50;
}

.status-title-inline.status-offline {
  color: #f44336;
}

.status-detail-inline {
  font-size: 11px;
  color: #666;
  line-height: 1.2;
  margin-top: 2px;
}

/* Compact Menu Button - Better Navbar Integration */
.menu-btn-compact {
  margin-left: 8px;
  margin-right: 4px;
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 600;
  text-transform: none;
  font-size: 13px;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
  min-width: 90px;
  height: 36px;
}

.menu-btn-compact:hover {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
  background: linear-gradient(135deg, #1565c0 0%, #1976d2 100%);
}

/* Compact Menu Card - Smaller and Better Positioned */
.menu-card-compact {
  border-radius: 16px;
  overflow: hidden;
  background: #ffffff;
  border: none;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(8px);
  min-width: 260px;
  max-width: 280px;
  margin-top: 2px;
}

/* Compact Menu Header */
.menu-header-compact {
  padding: 12px 16px 10px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%);
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(25, 118, 210, 0.06);
}

.menu-header-text-compact {
  font-size: 14px;
  font-weight: 600;
  color: #1976d2;
  letter-spacing: 0.3px;
}

/* Compact Menu List */
.menu-list-compact {
  padding: 8px 6px 12px;
  background: #ffffff;
}

/* Compact Menu Items */
.menu-item-compact {
  border-radius: 12px;
  margin: 3px 0;
  padding: 12px 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  min-height: 56px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-item-compact::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  transition: all 0.3s ease;
  z-index: 0;
  border-radius: 12px;
}

.menu-item-compact:hover::before {
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(66, 165, 245, 0.08) 100%);
}

.menu-item-compact:hover {
  transform: translateX(3px) scale(1.01);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
}

/* Compact Icon Wrapper */
.menu-icon-wrapper-compact {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}

/* Compact Content Wrapper */
.menu-content-compact {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  position: relative;
  z-index: 1;
}

/* Compact Icon Colors */
.primary-icon {
  background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
  box-shadow: 0 2px 6px rgba(25, 118, 210, 0.2);
}

.secondary-icon {
  background: linear-gradient(135deg, #7b1fa2 0%, #ba68c8 100%);
  box-shadow: 0 2px 6px rgba(123, 31, 162, 0.2);
}

.info-icon {
  background: linear-gradient(135deg, #0288d1 0%, #4fc3f7 100%);
  box-shadow: 0 2px 6px rgba(2, 136, 209, 0.2);
}

.neutral-icon {
  background: linear-gradient(135deg, #616161 0%, #9e9e9e 100%);
  box-shadow: 0 2px 6px rgba(97, 97, 97, 0.2);
}

.danger-icon {
  background: linear-gradient(135deg, #d32f2f 0%, #f44336 100%);
  box-shadow: 0 2px 6px rgba(211, 47, 47, 0.2);
}

/* Compact Text Styling */
.menu-item-title-compact {
  font-weight: 600;
  font-size: 14px;
  color: #212121;
  line-height: 1.2;
  margin-bottom: 1px;
}

.menu-item-subtitle-compact {
  font-size: 11px;
  color: #666666;
  line-height: 1.3;
  font-weight: 400;
}

/* Compact Section Divider */
.menu-section-divider-compact {
  margin: 8px 10px;
  opacity: 0.12;
  border-color: #1976d2;
}

/* Compact Hover Effects */
.primary-action:hover .primary-icon {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 3px 8px rgba(25, 118, 210, 0.25);
}

.secondary-action:hover .secondary-icon {
  transform: scale(1.1) rotate(-5deg);
  box-shadow: 0 3px 8px rgba(123, 31, 162, 0.25);
}

.info-action:hover .info-icon {
  transform: scale(1.1) rotate(360deg);
  box-shadow: 0 3px 8px rgba(2, 136, 209, 0.25);
}

.neutral-action:hover .neutral-icon {
  transform: scale(1.1);
  box-shadow: 0 3px 8px rgba(97, 97, 97, 0.25);
}

.danger-action:hover .danger-icon {
  transform: scale(1.1) rotate(-5deg);
  box-shadow: 0 3px 8px rgba(211, 47, 47, 0.25);
}

.danger-action:hover::before {
  background: linear-gradient(135deg, rgba(211, 47, 47, 0.05) 0%, rgba(244, 67, 54, 0.08) 100%) !important;
}

/* Compact Responsive Design */
@media (max-width: 768px) {
  .menu-card-compact {
    min-width: 240px;
    max-width: 260px;
    border-radius: 14px;
  }

  .menu-item-compact {
    padding: 10px 14px;
    min-height: 52px;
    gap: 10px;
  }

  .menu-icon-wrapper-compact {
    width: 30px;
    height: 30px;
  }

  .menu-header-compact {
    padding: 10px 14px 8px;
  }

  .menu-btn-compact {
    margin-left: 6px;
    padding: 5px 14px;
    min-width: 85px;
    height: 34px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .menu-card-compact {
    min-width: 220px;
    max-width: 240px;
  }

  .menu-item-compact {
    padding: 9px 12px;
    min-height: 48px;
    gap: 9px;
  }

  .menu-header-compact {
    padding: 9px 12px 7px;
  }

  .menu-btn-compact {
    min-width: 80px;
    height: 32px;
  }
}

/* Compact Animation for Menu Appearance */
.v-overlay__content {
  animation: menuSlideInCompact 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes menuSlideInCompact {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Compact Focus States */
.menu-item-compact:focus-visible {
  outline: 1px solid #1976d2;
  outline-offset: 1px;
}

.menu-btn-compact:focus-visible {
  outline: 1px solid #1976d2;
  outline-offset: 2px;
}

/* Offline Invoices Button Enhancement */
.offline-invoices-btn {
  position: relative;
  transition: all 0.3s ease;
  padding: 4px;
  /* Reduced padding */
}

.offline-invoices-btn:hover {
  transform: scale(1.05);
}

.offline-invoices-btn.has-pending {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4);
  }

  70% {
    box-shadow: 0 0 0 8px rgba(244, 67, 54, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
  }
}

/* Remove any text decoration globally for navbar */
.navbar-enhanced * {
  text-decoration: none !important;
}

.navbar-enhanced a {
  text-decoration: none !important;
}

.navbar-enhanced a:hover {
  text-decoration: none !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .brand-title {
    font-size: 1.2rem !important;
  }

  .profile-section {
    margin: 0 8px;
  }

  .profile-chip {
    padding: 6px 12px;
  }

  .menu-btn-enhanced {
    padding: 6px 16px;
  }

  .status-info-always-visible {
    display: none;
  }

  .status-section-enhanced {
    margin-right: 4px;
    /* Further reduced for mobile */
  }
}

@media (max-width: 480px) {
  .logo-container {
    margin: 0 8px;
  }

  .brand-title {
    font-size: 1rem !important;
  }
}

/* About Dialog - Improved Compact Styling */
.about-dialog-card-improved {
  border-radius: 16px !important;
  overflow: hidden;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;
  max-height: 90vh;
}

/* Improved Header with Better Spacing */
.about-header-improved {
  background: white;
  color: #1a1a1a;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
  min-height: auto !important;
}

.about-header-improved::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #1976d2 0%, #42a5f5 100%);
}

.header-content-improved {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-right: 60px; /* Space for close button */
}

.header-icon-wrapper-improved {
  background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
  border-radius: 14px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
}

.header-icon {
  color: white;
}

.header-text-improved {
  flex: 1;
}

.header-title-improved {
  margin: 0 0 4px 0;
  font-weight: 600;
  color: #1a1a1a;
  font-size: 1.25rem;
  line-height: 1.2;
}

.header-subtitle-improved {
  margin: 0;
  font-size: 14px;
  color: #666;
  font-weight: 400;
  line-height: 1.2;
}

.header-stats-improved {
  display: flex;
  gap: 8px;
}

.status-chip-improved {
  font-weight: 600;
  border-radius: 10px;
  height: 28px !important;
}

.close-btn-improved {
  position: absolute;
  top: 12px;
  right: 12px;
  color: #666 !important;
}

.white-background {
  background: white;
}

/* Improved Content */
.content-container-improved {
  padding: 20px;
  max-height: 55vh;
  overflow-y: auto;
}

.empty-state-improved {
  padding: 30px;
}

/* Apps List - Improved Grid Layout */
.apps-list-improved {
  width: 100%;
}

.apps-header-improved {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.apps-grid-improved {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  max-height: 350px;
  overflow-y: auto;
}

.app-item-improved {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 10px;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.app-item-improved:hover {
  background: #e3f2fd;
  border-color: #1976d2;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.15);
}

.app-icon-improved {
  background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
  border-radius: 8px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 34px;
}

.app-details-improved {
  flex: 1;
  min-width: 0;
}

.app-name-improved {
  font-weight: 500;
  font-size: 14px;
  color: #1a1a1a;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-version-improved {
  font-size: 12px;
  color: #666;
  font-weight: 400;
  line-height: 1.3;
  margin-top: 2px;
}

/* Improved Footer */
.dialog-actions-improved {
  background: #f8f9fa;
  border-top: 1px solid #f0f0f0;
  min-height: auto !important;
}

.footer-info-improved {
  display: flex;
  align-items: center;
}

.footer-text-improved {
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;
}

.close-btn-action-improved {
  border-radius: 10px;
  font-weight: 600;
  text-transform: none;
  height: 36px;
  padding: 0 20px;
}

/* Responsive Design */
@media (max-width: 700px) {
  .about-dialog-card-improved {
    margin: 16px;
    max-height: 85vh;
  }
  
  .apps-grid-improved {
    grid-template-columns: 1fr;
    max-height: 300px;
  }
  
  .header-content-improved {
    gap: 12px;
    padding-right: 50px;
  }
  
  .content-container-improved {
    padding: 16px;
    max-height: 50vh;
  }
}

/* Scrollbar Styling */
.content-container-improved::-webkit-scrollbar,
.apps-grid-improved::-webkit-scrollbar {
  width: 6px;
}

.content-container-improved::-webkit-scrollbar-track,
.apps-grid-improved::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.content-container-improved::-webkit-scrollbar-thumb,
.apps-grid-improved::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.content-container-improved::-webkit-scrollbar-thumb:hover,
.apps-grid-improved::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* --- Dark Theme Adjustments --- */
/* Navbar and Drawer styling when dark mode is active */
:deep(.dark-theme) .navbar-enhanced,
:deep(.v-theme--dark) .navbar-enhanced,
::v-deep(.dark-theme) .navbar-enhanced,
::v-deep(.v-theme--dark) .navbar-enhanced {
  background-color: #1e1e1e !important;
  background-image: none !important;
  border-bottom-color: #333 !important;
  color: #ffffff !important;
}

:deep(.dark-theme) .drawer-custom,
:deep(.v-theme--dark) .drawer-custom,
::v-deep(.dark-theme) .drawer-custom,
::v-deep(.v-theme--dark) .drawer-custom {
  background-color: #121212 !important;
}

:deep(.dark-theme) .drawer-item-title,
:deep(.v-theme--dark) .drawer-item-title,
::v-deep(.dark-theme) .drawer-item-title,
::v-deep(.v-theme--dark) .drawer-item-title {
  color: #e0e0e0 !important;
}

:deep(.dark-theme) .drawer-header .drawer-company,
:deep(.v-theme--dark) .drawer-header .drawer-company,
::v-deep(.dark-theme) .drawer-header .drawer-company,
::v-deep(.v-theme--dark) .drawer-header .drawer-company {
  color: #e0e0e0 !important;
}
</style>
