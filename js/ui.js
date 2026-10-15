(function () {
  const categoryColors = ["#7968f5", "#f4a261", "#57b99a", "#e7799b", "#63a6e8", "#ba83d8", "#d6a83e"];
  const numberFormatter = new Intl.NumberFormat("ko-KR");

  function element(tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function formatWon(amount) {
    return numberFormatter.format(Math.round(amount)) + "원";
  }

  function renderSummary(subscriptions, today) {
    document.getElementById("monthly-total").textContent = formatWon(getTotalMonthlyAmount(subscriptions));
    document.getElementById("yearly-total").textContent = formatWon(getTotalYearlyAmount(subscriptions));

    const upcoming = getUpcomingPayments(subscriptions, today, 6);
    document.getElementById("upcoming-count").textContent = upcoming.length + "건";
    document.getElementById("upcoming-caption").textContent = upcoming.length
      ? "가장 가까운 결제 " + upcoming
        .map(function (subscription) {
          return getDaysUntilPayment(today, subscription.nextPaymentDate);
        })
        .sort(function (a, b) { return a - b; })[0] + "일 이내"
      : "앞으로 7일 이내";
  }

  function renderSubscriptions(subscriptions, today) {
    const list = document.getElementById("subscription-list");
    const emptyState = document.getElementById("empty-state");
    list.replaceChildren();
    document.getElementById("subscription-count").textContent = "등록된 구독 " + subscriptions.length + "개";
    emptyState.hidden = subscriptions.length > 0;
    list.hidden = subscriptions.length === 0;

    subscriptions.forEach(function (subscription) {
      const card = element("article", "subscription-card");
      const main = element("div", "subscription-main");
      const icon = element("div", "service-icon", subscription.name.trim().charAt(0).toUpperCase());
      icon.setAttribute("aria-hidden", "true");
      const copy = element("div", "service-copy");
      const meta = element("div", "service-meta");
      meta.append(
        element("span", "category-tag", subscription.category),
        element("span", "service-payment", subscription.paymentMethod || "결제 수단 미지정")
      );
      copy.append(element("p", "service-name", subscription.name), meta);
      main.append(icon, copy);

      const side = element("div", "subscription-side");
      const priceCopy = element("div", "price-copy");
      priceCopy.append(
        element("p", "service-price", formatWon(getMonthlyAmount(subscription))),
        element("span", "service-cycle", subscription.cycle === "yearly" ? "월 환산 · 매년 결제" : "월 금액")
      );
      side.append(priceCopy);
      const ddayCount = getDaysUntilPayment(today, subscription.nextPaymentDate);
      const ddayLabel = ddayCount < 0 ? Math.abs(ddayCount) + "일 지남" : ddayCount === 0 ? "오늘 결제" : "D-" + ddayCount;
      const dday = element("span", "dday" + (ddayCount >= 0 && ddayCount <= 6 ? " soon" : ""), ddayLabel + " · 다음 결제");
      const actions = element("div", "card-actions");
      const editButton = element("button", "text-button", "수정");
      editButton.type = "button";
      editButton.dataset.action = "edit";
      editButton.dataset.id = subscription.id;
      editButton.setAttribute("aria-label", subscription.name + " 수정");
      const deleteButton = element("button", "text-button delete-button", "삭제");
      deleteButton.type = "button";
      deleteButton.dataset.action = "delete";
      deleteButton.dataset.id = subscription.id;
      deleteButton.setAttribute("aria-label", subscription.name + " 삭제");
      actions.append(editButton, deleteButton);
      card.append(main, side, dday, actions);
      list.append(card);
    });
  }

  function renderCategories(subscriptions) {
    const list = document.getElementById("category-list");
    const empty = document.getElementById("category-empty");
    list.replaceChildren();
    const categories = getMonthlyAmountByCategory(subscriptions);
    const total = getTotalMonthlyAmount(subscriptions);
    const entries = Object.entries(categories).sort(function (a, b) { return b[1] - a[1]; });
    empty.hidden = entries.length > 0;
    list.hidden = entries.length === 0;

    entries.forEach(function (entry, index) {
      const row = element("div", "category-row");
      const top = element("div", "category-row-top");
      const label = element("div", "category-label");
      const swatch = element("span", "category-swatch");
      const color = categoryColors[index % categoryColors.length];
      swatch.style.backgroundColor = color;
      label.append(swatch, element("span", "", entry[0]));
      const percentage = total > 0 ? Math.round((entry[1] / total) * 100) : 0;
      top.append(label, element("span", "category-value", formatWon(entry[1]) + " · " + percentage + "%"));
      const track = element("div", "progress-track");
      const fill = element("div", "progress-fill");
      fill.style.width = percentage + "%";
      fill.style.backgroundColor = color;
      track.append(fill);
      row.append(top, track);
      list.append(row);
    });
  }

  function render(subscriptions, today) {
    renderSummary(subscriptions, today);
    renderSubscriptions(subscriptions, today);
    renderCategories(subscriptions);
  }

  window.SubscriptionUI = { render: render };
}());
