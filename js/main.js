(function () {
  "use strict";

  const STORAGE_KEY = "subtrack-subscriptions";
  const form = document.getElementById("subscription-form");
  const formPanel = document.getElementById("form-panel");
  const formTitle = document.getElementById("form-title");
  const saveButton = document.getElementById("save-button");
  const notice = document.getElementById("app-notice");
  let subscriptions = [];
  let editingId = null;

  function localDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function todayString() {
    return localDateString(new Date());
  }

  function showNotice(message) {
    notice.textContent = message;
    notice.hidden = false;
  }

  function clearNotice() {
    notice.textContent = "";
    notice.hidden = true;
  }

  function render() {
    SubscriptionUI.render(subscriptions, todayString());
  }

  function saveSubscriptions() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
      clearNotice();
      return true;
    } catch (error) {
      showNotice("브라우저 저장소에 저장하지 못했어요. 브라우저의 저장 공간 설정을 확인해주세요.");
      console.error("구독 정보를 localStorage에 저장하지 못했습니다.", error);
      return false;
    }
  }

  function loadSubscriptions() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) throw new Error("저장된 구독 데이터가 배열이 아닙니다.");

      return parsed.filter(function (item) {
        return item &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          typeof item.amount === "number" &&
          Number.isFinite(item.amount) &&
          item.amount > 0 &&
          (item.cycle === "monthly" || item.cycle === "yearly") &&
          typeof item.nextPaymentDate === "string" &&
          typeof item.category === "string" &&
          typeof item.paymentMethod === "string";
      });
    } catch (error) {
      showNotice("저장된 구독 정보를 읽지 못했어요. 데이터가 손상되었거나 저장소에 접근할 수 없습니다.");
      console.error("구독 정보를 localStorage에서 읽지 못했습니다.", error);
      return [];
    }
  }

  function openForm(subscription) {
    clearNotice();
    form.reset();
    editingId = subscription ? subscription.id : null;
    formTitle.textContent = subscription ? "구독 수정" : "새 구독 추가";
    saveButton.textContent = subscription ? "변경 사항 저장" : "구독 추가하기";
    if (subscription) {
      form.elements.name.value = subscription.name;
      form.elements.amount.value = subscription.amount;
      form.elements.cycle.value = subscription.cycle;
      form.elements.nextPaymentDate.value = subscription.nextPaymentDate;
      form.elements.category.value = subscription.category;
      form.elements.paymentMethod.value = subscription.paymentMethod || "";
    } else {
      form.elements.nextPaymentDate.value = todayString();
    }
    formPanel.hidden = false;
    form.elements.name.focus();
    formPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function closeForm() {
    form.reset();
    editingId = null;
    formPanel.hidden = true;
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "sub-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  }

  function readFormData() {
    const amount = Number(form.elements.amount.value);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      showNotice("금액은 1원 이상의 정수로 입력해주세요.");
      form.elements.amount.focus();
      return null;
    }

    const name = form.elements.name.value.trim();
    const category = form.elements.category.value.trim();
    if (!name || !category) {
      showNotice("구독 이름과 카테고리를 입력해주세요.");
      return null;
    }

    return {
      id: editingId || createId(),
      name: name,
      amount: amount,
      cycle: form.elements.cycle.value,
      nextPaymentDate: form.elements.nextPaymentDate.value,
      category: category,
      paymentMethod: form.elements.paymentMethod.value.trim() || "미지정"
    };
  }

  document.getElementById("today-label").textContent = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(new Date());

  subscriptions = loadSubscriptions();
  render();

  document.getElementById("show-form-button").addEventListener("click", function () { openForm(null); });
  document.getElementById("empty-add-button").addEventListener("click", function () { openForm(null); });
  document.getElementById("close-form-button").addEventListener("click", closeForm);
  document.getElementById("cancel-form-button").addEventListener("click", closeForm);

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearNotice();
    if (!form.reportValidity()) return;

    const subscription = readFormData();
    if (!subscription) return;

    if (editingId) {
      subscriptions = subscriptions.map(function (item) {
        return item.id === editingId ? subscription : item;
      });
    } else {
      subscriptions.push(subscription);
    }

    saveSubscriptions();
    render();
    closeForm();
  });

  document.getElementById("subscription-list").addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const subscription = subscriptions.find(function (item) { return item.id === button.dataset.id; });
    if (!subscription) {
      showNotice("선택한 구독을 찾지 못했어요. 목록을 새로고침한 뒤 다시 시도해주세요.");
      return;
    }

    if (button.dataset.action === "edit") {
      openForm(subscription);
    } else if (button.dataset.action === "delete") {
      if (!window.confirm("“" + subscription.name + "” 구독을 삭제할까요?")) return;
      subscriptions = subscriptions.filter(function (item) { return item.id !== subscription.id; });
      saveSubscriptions();
      render();
    }
  });
}());
