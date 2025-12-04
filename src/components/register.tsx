import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text"
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";
import statesData from "../../states.json";
import districtsData from "../../districts.json";

const userSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name is large")
    .regex(/^[A-Za-z.\s]+$/, "Only charecters are allowed"),

  address: z
    .string()
    .min(1, "Address is required")
    .max(500, "Address is too long"),

  state: z.string().min(1, "Please select a state"),

  district: z.string().min(1, "Please select a district"),

  pincode: z
    .string()
    .min(6, "Pincode must be 6 digits")
    .max(6, "Pincode must be 6 digits")
    .regex(/^[0-9]{6}$/, "Pincode must be numeric"),

  id: z
    .string()
    .regex(/^ZMR(00[1-9]|0[1-9][0-9]|[1-4][0-9]{2})$/, "Employee ID not found"),
});

type FormData = z.infer<typeof userSchema>;

interface PostalApi {
  Status: string;
  PostOffice: Array<{
    District: string;
    State: string;
  }>;
}

function Register() {
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [submittedData, setSubmittedData] = useState<FormData | null>(null);
  const confettiRef = useRef<ConfettiRef>(null);

  const districts = selectedState
    ? districtsData[selectedState as keyof typeof districtsData] || []
    : [];

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    setSelectedDistrict("");
    setValue("state", value);
    setValue("district", "");
    trigger("state");
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    setValue("district", value);
    trigger("district");
  };

  const handleClear = () => {
    resetName();
    setSelectedState("");
    setSelectedDistrict("");
    setShowSuccess(false);
    setSubmittedData(null);
  };

  const handleEdit = () => {
    if (submittedData) {
      setValue("name", submittedData.name);
      setValue("id", submittedData.id);
      setValue("address", submittedData.address);
      setValue("pincode", submittedData.pincode);
      setSelectedState(submittedData.state);
      setValue("state", submittedData.state);
      setSelectedDistrict(submittedData.district);
      setValue("district", submittedData.district);
    }
    setShowSuccess(false);
  };

  const onSubmit = (data: FormData) => {
    console.log("Form submitted!", data);

    const formData = {
      name: data.name,
      employeeId: data.id,
      address: data.address,
      state: data.state,
      district: data.district,
      pincode: data.pincode,
      timestamp: new Date().toISOString(),
    };

    const existingData = localStorage.getItem("employeeRegistrations");
    const registrations = existingData ? JSON.parse(existingData) : [];

    registrations.push(formData);

    localStorage.setItem(
      "employeeRegistrations",
      JSON.stringify(registrations)
    );

    setSubmittedData(data);
    setShowSuccess(true);

    setTimeout(() => {
      confettiRef.current?.fire({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
      });
    }, 100);

    setTimeout(() => {
      confettiRef.current?.fire({
        particleCount: 100,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confettiRef.current?.fire({
        particleCount: 100,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 300);

    setTimeout(() => {
      handleClear();
    }, 200000);
  };

  const {
    register,
    formState: { errors },
    reset: resetName,
    handleSubmit,
    setValue,
    trigger,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(userSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      id: "ZMR",
      address: "",
      state: "",
      district: "",
      pincode: "",
    },
  });

  const pincode = watch("pincode");

  useEffect(() => {
    if (pincode?.length !== 6) {
      return;
    }
    fetch(`https://api.postalpincode.in/pincode/${pincode}`)
      .then((res) => res.json())
      .then((data: PostalApi[]) => {
        const [response] = data;
        if (response.Status === "Success") {
          const { District, State } = response.PostOffice[0];
          setSelectedState(State);
          setValue("state", State, { shouldValidate: true });
          trigger("state");
          setTimeout(() => {
            const districts =
              (districtsData as Record<string, string[]>)[State] || [];
            const match = districts.find(
              (d) =>
                d.toLowerCase() === District.toLowerCase() ||
                d.toLowerCase().includes(District.toLowerCase()) ||
                District.toLowerCase().includes(d.toLowerCase())
            );
            setSelectedDistrict(match || District);
            setValue("district", match || District, { shouldValidate: true });
            trigger("district");
          }, 500);
        }
      })
      .catch((err) => {
        console.error("Error fetching data from Postal API:", err);
      });
  }, [pincode, setValue, trigger]);

  return (
    <>
      {" "}
      <Confetti
        ref={confettiRef}
        className="fixed inset-0 z-[100] pointer-events-none w-full h-full"
        style={{ width: "", height: "100%" }}
        manualstart={true}
      />
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSuccess(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl p-8 max-w-md mx-4 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center">
                <img src="/tick-mark.png" className="animate-pulse" alt="" />
              </div>
              <p className="text-gray-600">Employee registered successfully.</p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  className="bg-chart-5 hover:bg-chart-5 text-white cursor-pointer"
                  onClick={handleEdit}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  className="bg-card hover:bg-card text-foreground cursor-pointer"
                  onClick={handleClear}
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <form
          className="w-[460px] bg-card text-card-foreground shadow-lg rounded-lg p-8 space-y-6 border border-border"
          onSubmit={handleSubmit(onSubmit)}
        >
            <div className="relative mb-6 flex justify-center items-center">
            <AnimatedGradientText className="text-3xl font-bold text-center">
              Employee Register
            </AnimatedGradientText>
            <div className="absolute top-[-10px] right-[-8px]">
              <AnimatedThemeToggler type="button" />
            </div>
            </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <div className="flex-1">
              <Label className="flex flex-col items-start gap-2 text-sm font-medium text-foreground">
                Employee Name
                <Input {...register("name")} type="text" placeholder="Name" />
              </Label>
              <div className="h-5">
                {errors.name && (
                  <span className="text-destructive text-xs">
                    {errors.name.message}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1">
              <Label className="flex flex-col items-start gap-2 text-sm font-medium text-foreground">
                Employee Id
                <div className="relative w-full">
                  <Input
                    type="text"
                    placeholder="000"
                    {...register("id", {
                      onChange: (e) => {
                        let value = e.target.value;
                        if (!value.startsWith("ZMR")) {
                          value = "ZMR" + value.replace(/^ZMR/g, "");
                        }
                        const numbers = value.slice(3).replace(/\D/g, "");
                        value = "ZMR" + numbers.slice(0, 3);
                        e.target.value = value;
                        setValue("id", value, { shouldValidate: true });
                      },
                    })}
                    maxLength={6}
                    onKeyDown={(e) => {
                      const input = e.currentTarget;
                      if (
                        e.key === "Backspace" &&
                        input.selectionStart !== null &&
                        input.selectionStart <= 3
                      ) {
                        e.preventDefault();
                      }
                    }}
                    onFocus={(e) => {
                      if (e.target.value === "ZMR" || e.target.value === "") {
                        e.target.value = "ZMR";
                        setValue("id", "ZMR");
                        setTimeout(() => e.target.setSelectionRange(3, 3), 0);
                      }
                    }}
                  />
                </div>
              </Label>
              <div className="h-5">
                {errors.id && (
                  <span className="text-destructive text-xs">
                    {errors.id.message}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div>
            <Label className="flex flex-col items-start gap-2 text-sm font-medium text-foreground">
              Address
            </Label>
            <Textarea
              placeholder="Enter Address"
              rows={3}
              className="break-words h-20"
              {...register("address")}
            />
            <div className="h-5">
              {errors.address && (
                <span className="text-destructive text-xs">
                  {errors.address.message}
                </span>
              )}
            </div>
          </div>
          <div>
            <Label className="flex flex-col items-start gap-2 text-sm font-medium text-foreground">
              State
            </Label>
            <Select value={selectedState} onValueChange={handleStateChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {statesData.states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="h-5">
              {errors.state && (
                <span className="text-destructive text-xs">
                  {errors.state.message}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <div className="flex-1">
              <Label className="flex flex-col items-start gap-2 text-sm font-medium text-foreground">
                District
                <Select
                  value={selectedDistrict}
                  onValueChange={handleDistrictChange}
                  disabled={!selectedState}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        selectedState ? "Select District" : "Select State First"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Label>
              <div className="h-5">
                {errors.district && (
                  <span className="text-destructive text-xs">
                    {errors.district.message}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1">
              <Label className="flex flex-col items-start gap-2 text-sm font-medium text-foreground">
                Pincode
                <Input
                  type="text"
                  placeholder="Enter Pincode"
                  {...register("pincode")}
                  maxLength={6}
                />
              </Label>
              <div className="h-5">
                {errors.pincode && (
                  <span className="text-destructive text-xs">
                    {errors.pincode.message}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <Button
              type="submit"
              className="bg-chart-5 hover:bg-chart-1 text-white cursor-pointer"
            >
              Submit
            </Button>
            <Button
              type="button"
              className="bg-card hover:bg-accent text-foreground cursor-pointer"
              onClick={handleClear}
            >
              Clear
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

export default Register;
