export default class CreateReviewModal {
  constructor({ restaurantID, onSubmit }) {
    // args
    this.onSubmit = onSubmit;
    this.restaurantID = restaurantID;
    // bind methods
    this.getFormState = this.getFormState.bind(this);
    this.closeBtnHandler = this.closeBtnHandler.bind(this);
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.submitForm = this.submitForm.bind(this);
    this.formSubmissionHandler = this.formSubmissionHandler.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    // grab DOM
    this.modal = document.querySelector("#create-review");
    this.form = document.querySelector("#create-review-form");
    this.closeBtn = document.querySelector("#close-create-review-modal-btn");
    this.internalFocusableEls = this.modal.querySelectorAll(
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex="0"]'
    );
    this.firstFocusableEl = this.internalFocusableEls[0];
    this.lastFocusableEl = this.internalFocusableEls[
      this.internalFocusableEls.length - 1
    ];

    // wire up event listeners
    this.internalFocusableEls.forEach(el =>
      el.addEventListener("keydown", this.handleKeyDown)
    );
    this.closeBtn.addEventListener("click", this.closeBtnHandler);
    this.form.addEventListener("submit", this.formSubmissionHandler);
  }
  getFormState() {
    const name = document.querySelector("#name").value;
    const rating = document.querySelector("#rating").value;
    const comments = document.querySelector("#comments").value;
    return { name, restaurant_id: this.restaurantID, rating, comments };
  }

  clearFormState() {
    document.querySelector("#name").value = "";
    document.querySelector("#rating").value = "";
    document.querySelector("#comments").value = "";
  }

  open() {
    this.modal.removeAttribute("hidden");
    window.setTimeout(() => {
      this.focusedElBeforeOpen = document.activeElement;
      this.modal.style.transform = "translateY(0)";
      this.firstFocusableEl.focus();
    }, 50);
  }

  close() {
    this.modal.style.transform = "translateY(100vh)";
    this.focusedElBeforeOpen.focus();
    window.setTimeout(() => {
      this.modal.setAttribute("hidden", true);
    }, 150);
  }

  closeBtnHandler(evt) {
    evt.preventDefault();
    this.close();
  }

  submitForm() {
    this.close();
    const postBody = this.getFormState();
    console.log(`[App] Submitting post data`, postBody);
    this.onSubmit(postBody);
    this.clearFormState();
  }

  formSubmissionHandler(evt) {
    evt.preventDefault();
    this.submitForm();
  }

  // Based on https://bitsofco.de/accessible-modal-dialog/
  handleKeyDown(e) {
    const KEY_TAB = 9;
    const KEY_ESC = 27;
    const KEY_ENTER = 27;

    const handleBackwardTab = () => {
      if (document.activeElement === this.firstFocusableEl) {
        e.preventDefault();
        this.lastFocusableEl.focus();
      }
    };
    const handleForwardTab = () => {
      if (document.activeElement === this.lastFocusableEl) {
        e.preventDefault();
        this.firstFocusableEl.focus();
      }
    };

    switch (e.keyCode) {
      case KEY_TAB:
        if (this.internalFocusableEls.length === 1) {
          e.preventDefault();
          break;
        }
        if (e.shiftKey) {
          handleBackwardTab();
        } else {
          handleForwardTab();
        }
        break;
      case KEY_ESC:
        this.close();
        break;
      case KEY_ENTER:
        this.close();
        break;
      default:
        break;
    }
  }
}
