import { api } from "../api.js";
import { getAuthToken, isLoggedIn } from "../auth.js";

type Invite = {
  inviteId: number;
  inviterName: string;
  apartmentName: string;
  sentAtInEpochSeconds: number;
};

type InvitesResponse = {
  invites: Invite[];
};

const ui = {
  invitesList: document.getElementById(
    "no-apartment-invites",
  ) as HTMLDivElement | null,
  message: document.getElementById(
    "no-apartment-message",
  ) as HTMLDivElement | null,
};

const redirectToLogin = (): void => {
  window.location.href = "login.html";
};

const getHeaders = (): HeadersInit => ({
  Authorization: `Bearer ${getAuthToken()}`,
  "Content-Type": "application/json",
  Accept: "application/json",
});

const showMessage = (message: string): void => {
  if (!ui.message) {
    return;
  }

  ui.message.textContent = message;
  ui.message.classList.remove("d-none");
};

const clearMessage = (): void => {
  if (!ui.message) {
    return;
  }

  ui.message.textContent = "";
  ui.message.classList.add("d-none");
};

const renderEmptyState = (): void => {
  if (!ui.invitesList) {
    return;
  }

  ui.invitesList.innerHTML = `
    <div class="text-muted py-3">No invites</div>
  `;
};

const renderInvites = (invites: Invite[]): void => {
  if (!ui.invitesList) {
    return;
  }

  ui.invitesList.innerHTML = "";

  if (invites.length === 0) {
    renderEmptyState();
    return;
  }

  invites.forEach((invite) => {
    const inviteCard = document.createElement("div");
    inviteCard.className = "border rounded-3 p-3 bg-white";

    const content = document.createElement("div");
    content.className = "d-flex gap-3 align-items-start";

    const avatar = document.createElement("div");
    avatar.className = "roommate-avatar flex-shrink-0 d-flex align-items-center justify-content-center";
    avatar.innerHTML = '<i class="fas fa-user text-secondary"></i>';

    const textWrapper = document.createElement("div");
    textWrapper.className = "flex-grow-1";

    const apartmentName = document.createElement("div");
    apartmentName.className = "fw-bold fs-6";
    apartmentName.textContent = invite.apartmentName;

    const inviterName = document.createElement("div");
    inviterName.className = "text-muted small";
    inviterName.textContent = `Invite from ${invite.inviterName}`;

    textWrapper.append(apartmentName, inviterName);

    const actions = document.createElement("div");
    actions.className = "d-flex gap-2 flex-shrink-0";

    const acceptButton = document.createElement("button");
    acceptButton.type = "button";
    acceptButton.className = "btn btn-success btn-sm";
    acceptButton.innerHTML = '<i class="fas fa-check"></i>';
    acceptButton.setAttribute("aria-label", `Accept invite for ${invite.apartmentName}`);

    const declineButton = document.createElement("button");
    declineButton.type = "button";
    declineButton.className = "btn btn-outline-danger btn-sm";
    declineButton.innerHTML = '<i class="fas fa-times"></i>';
    declineButton.setAttribute("aria-label", `Decline invite for ${invite.apartmentName}`);

    acceptButton.addEventListener("click", async () => {
      await handleAcceptInvite(invite.inviteId);
    });

    declineButton.addEventListener("click", async () => {
      await handleDeclineInvite(invite.inviteId);
    });

    actions.append(acceptButton, declineButton);
    content.append(avatar, textWrapper, actions);
    inviteCard.appendChild(content);
    ui.invitesList?.appendChild(inviteCard);
  });
};

const fetchInvites = async (): Promise<void> => {
  if (!isLoggedIn() || !getAuthToken()) {
    redirectToLogin();
    return;
  }

  clearMessage();

  try {
    const response = await fetch(api("invites"), {
      method: "GET",
      headers: getHeaders(),
    });

    if (response.status === 401) {
      const errorData = (await response.json().catch(() => null)) as { error?: string } | null;
      showMessage(errorData?.error || "Your session expired. Please log in again.");
      redirectToLogin();
      return;
    }

    if (!response.ok) {
      showMessage("Could not load invites.");
      renderEmptyState();
      return;
    }

    const data = (await response.json()) as InvitesResponse;
    renderInvites(data.invites ?? []);
  } catch (error) {
    console.error("Error loading invites:", error);
    showMessage("Server connection error while loading invites.");
    renderEmptyState();
  }
};

const readErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  try {
    const errorData = (await response.json()) as { error?: string };
    return errorData.error || response.statusText || fallback;
  } catch {
    return response.statusText || fallback;
  }
};

const handleAcceptInvite = async (inviteId: number): Promise<void> => {
  clearMessage();

  try {
    const response = await fetch(api(`invites/${inviteId}/accept`), {
      method: "POST",
      headers: getHeaders(),
    });

    if (response.status === 204) {
      window.location.href = "apartment.html";
      return;
    }

    if (response.status === 401) {
      showMessage(await readErrorMessage(response, "Your session expired. Please log in again."));
      redirectToLogin();
      return;
    }

    showMessage(await readErrorMessage(response, "Failed to accept invite."));
  } catch (error) {
    console.error("Error accepting invite:", error);
    showMessage("Server connection error while accepting invite.");
  }
};

const handleDeclineInvite = async (inviteId: number): Promise<void> => {
  clearMessage();

  try {
    const response = await fetch(api(`invites/${inviteId}`), {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (response.status === 204) {
      await fetchInvites();
      return;
    }

    if (response.status === 401) {
      showMessage(await readErrorMessage(response, "Your session expired. Please log in again."));
      redirectToLogin();
      return;
    }

    showMessage(await readErrorMessage(response, "Failed to decline invite."));
  } catch (error) {
    console.error("Error declining invite:", error);
    showMessage("Server connection error while declining invite.");
  }
};

window.addEventListener("load", async () => {
  await fetchInvites();
});
