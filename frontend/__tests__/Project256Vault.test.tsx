import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import Project256Vault from "../components/Project256Vault";
import { PROJECT256_PROOF } from "../constants/project256";

jest.mock("../utils/project256", () => {
  const actual = jest.requireActual("../utils/project256");
  return {
    ...actual,
    fetchProject256Status: jest.fn(),
  };
});

const { fetchProject256Status } = jest.requireMock("../utils/project256") as {
  fetchProject256Status: jest.Mock;
};

describe("Project256Vault", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when closed", () => {
    fetchProject256Status.mockResolvedValue({ currentBlock: 26_006_478, unlockBlock: 51_200_000, framesMinted: 34 });
    render(<Project256Vault isOpen={false} onClose={jest.fn()} />);
    expect(screen.queryByTestId("project256-vault")).not.toBeInTheDocument();
    expect(fetchProject256Status).not.toHaveBeenCalled();
  });

  it("shows live block data and the countdown when open", async () => {
    fetchProject256Status.mockResolvedValue({ currentBlock: 26_006_478, unlockBlock: 51_200_000, framesMinted: 34 });
    render(<Project256Vault isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByTestId("project256-vault")).toBeInTheDocument();
    expect(screen.getByTestId("project256-unlock-block")).toHaveTextContent("51,200,000");

    await waitFor(() => {
      expect(screen.getByTestId("project256-current-block")).toHaveTextContent("26,006,478");
    });
    expect(screen.getByTestId("project256-blocks-remaining")).toHaveTextContent("25,193,522");
    expect(screen.getByTestId("project256-countdown")).toBeInTheDocument();
    expect(screen.getByText(/34 frames minted/)).toBeInTheDocument();
    expect(screen.getByTestId("project256-estimate")).toHaveTextContent("Estimated unlock: April");
  });

  it("ticks down every second once live data has loaded", async () => {
    jest.useFakeTimers();
    try {
      fetchProject256Status.mockResolvedValue({ currentBlock: 26_006_478, unlockBlock: 51_200_000, framesMinted: 34 });
      render(<Project256Vault isOpen={true} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("project256-current-block")).toHaveTextContent("26,006,478");
      });

      const readClock = () =>
        Number(screen.getByText("min").previousSibling?.textContent) * 60 +
        Number(screen.getByText("sec").previousSibling?.textContent);
      const before = readClock();

      await act(async () => {
        jest.advanceTimersByTime(5_000);
      });

      expect((before - readClock() + 3600) % 3600).toBe(5);
    } finally {
      jest.useRealTimers();
    }
  });

  it("falls back to the announcement estimate when the chain is unreachable", async () => {
    fetchProject256Status.mockRejectedValue(new Error("offline"));
    render(<Project256Vault isOpen={true} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Live chain data unavailable/)).toBeInTheDocument();
    });
    expect(screen.getByTestId("project256-estimate")).toHaveTextContent("April 17, 2036 at 9:50:23 PM UTC");
    expect(screen.getByTestId("project256-current-block")).toHaveTextContent("…");
  });

  it("announces the expired lock once the unlock block has passed", async () => {
    fetchProject256Status.mockResolvedValue({ currentBlock: 51_200_000, unlockBlock: 51_200_000, framesMinted: 300 });
    render(<Project256Vault isOpen={true} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("project256-unlocked")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("project256-countdown")).not.toBeInTheDocument();
  });

  it("rattles the padlock with a taunt when clicked", async () => {
    fetchProject256Status.mockResolvedValue({ currentBlock: 26_006_478, unlockBlock: 51_200_000, framesMinted: 34 });
    render(<Project256Vault isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByTestId("project256-taunt")).toHaveTextContent("");
    await act(async () => {
      fireEvent.click(screen.getByTestId("project256-padlock"));
    });
    expect(screen.getByTestId("project256-taunt")).toHaveTextContent("Nope.");

    await act(async () => {
      fireEvent.click(screen.getByTestId("project256-padlock"));
    });
    expect(screen.getByTestId("project256-taunt")).toHaveTextContent("Still locked.");
  });

  it("lists every proof transaction with an Etherscan link", async () => {
    fetchProject256Status.mockResolvedValue({ currentBlock: 26_006_478, unlockBlock: 51_200_000, framesMinted: 34 });
    render(<Project256Vault isOpen={true} onClose={jest.fn()} />);

    for (const entry of PROJECT256_PROOF) {
      const link = screen.getByRole("link", { name: entry.label });
      expect(link).toHaveAttribute("href", `https://etherscan.io/tx/${entry.tx}`);
    }
    expect(screen.getByRole("link", { name: "Project256 contract" })).toHaveAttribute(
      "href",
      "https://etherscan.io/address/0x67C9E1163EB2ea91CBE2C4907aCEf635Af9F0C5b",
    );
    await waitFor(() => expect(fetchProject256Status).toHaveBeenCalled());
  });

  it("closes from the X button, the backdrop and the Escape key", async () => {
    fetchProject256Status.mockResolvedValue({ currentBlock: 26_006_478, unlockBlock: 51_200_000, framesMinted: 34 });
    const onClose = jest.fn();
    render(<Project256Vault isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Close vault" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("project256-vault"));
    expect(onClose).toHaveBeenCalledTimes(2);

    // Clicking inside the panel must not close it.
    fireEvent.click(screen.getByText(/PROOF, STRAIGHT FROM THE CHAIN/));
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(3);
    await waitFor(() => expect(fetchProject256Status).toHaveBeenCalled());
  });
});
